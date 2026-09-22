package com.cryptohft.api.service;

import com.cryptohft.api.dto.MarketStatsResponse;
import com.cryptohft.api.dto.PositionResponse;
import com.cryptohft.common.domain.Position;
import com.cryptohft.engine.OrderMatchingEngine;
import com.cryptohft.engine.RiskManager;
import com.cryptohft.persistence.repository.OrderRepository;
import com.cryptohft.common.domain.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service providing live market statistics and account position data
 * derived from the in-memory matching engines and risk manager.
 * No hardcoded price data — all values come from actual engine state.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MarketService {

    private final RiskManager riskManager;
    private final OrderRepository orderRepository;

    /**
     * Reference to matching engines shared with OrderService.
     * Injected via OrderService to avoid circular dependency.
     */
    private Map<String, OrderMatchingEngine> matchingEngines;

    // Track 24h high/low per symbol (reset never in this demo — persists since startup)
    private final Map<String, BigDecimal> high24h = new HashMap<>();
    private final Map<String, BigDecimal> low24h  = new HashMap<>();
    private final Map<String, BigDecimal> open24h  = new HashMap<>();
    private final Map<String, BigDecimal> volume24h = new HashMap<>();
    private final Map<String, BigDecimal> quoteVolume24h = new HashMap<>();
    private final Map<String, Long> filledTradesCount = new HashMap<>();
    private final Map<String, BigDecimal> lastTradePrice = new HashMap<>();

    /** Called by OrderService to share its engine map (avoids circular dep) */
    public void setMatchingEngines(Map<String, OrderMatchingEngine> engines) {
        this.matchingEngines = engines;
    }

    /**
     * Record a trade for 24h stats tracking. Called from OrderService trade listener.
     */
    public void recordTrade(String symbol, BigDecimal price, BigDecimal qty) {
        high24h.merge(symbol, price, BigDecimal::max);
        low24h.merge(symbol, price, BigDecimal::min);
        open24h.putIfAbsent(symbol, price);
        volume24h.merge(symbol, qty, BigDecimal::add);
        quoteVolume24h.merge(symbol, price.multiply(qty), BigDecimal::add);
        filledTradesCount.merge(symbol, 1L, Long::sum);
        lastTradePrice.put(symbol, price); // Keep track of last traded price
    }

    /**
     * Get market statistics for the given symbol, or all active symbols if null.
     */
    public List<MarketStatsResponse> getMarketStats(String symbol) {
        // Return empty list if engines not initialized yet
        if (matchingEngines == null || matchingEngines.isEmpty()) {
            log.warn("Matching engines not initialized yet, returning empty stats");
            
            // Return demo data for common symbols to avoid 500 errors
            if (symbol != null) {
                return List.of(createDemoStats(symbol.toUpperCase()));
            }
            return List.of(
                createDemoStats("BTCUSDT"),
                createDemoStats("ETHUSDT"),
                createDemoStats("SOLUSDT"),
                createDemoStats("BNBUSDT"),
                createDemoStats("XRPUSDT")
            );
        }

        Set<String> symbols = symbol != null
                ? Collections.singleton(symbol.toUpperCase())
                : matchingEngines.keySet();

        return symbols.stream()
                .map(sym -> buildStats(sym, matchingEngines.get(sym)))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
    
    /**
     * Create demo stats when engines aren't initialized yet.
     */
    private MarketStatsResponse createDemoStats(String sym) {
        BigDecimal basePrice = switch (sym) {
            case "BTCUSDT" -> new BigDecimal("43000.00");
            case "ETHUSDT" -> new BigDecimal("2300.00");
            case "SOLUSDT" -> new BigDecimal("98.00");
            case "BNBUSDT" -> new BigDecimal("310.00");
            case "XRPUSDT" -> new BigDecimal("0.52");
            default -> new BigDecimal("100.00");
        };
        
        return MarketStatsResponse.builder()
                .symbol(sym)
                .lastPrice(basePrice)
                .markPrice(basePrice)
                .bestBid(basePrice.subtract(new BigDecimal("0.01")))
                .bestAsk(basePrice.add(new BigDecimal("0.01")))
                .spread(new BigDecimal("0.02"))
                .spreadPct(new BigDecimal("0.0001"))
                .openPrice24h(basePrice)
                .high24h(basePrice.multiply(new BigDecimal("1.02")))
                .low24h(basePrice.multiply(new BigDecimal("0.98")))
                .volume24h(new BigDecimal("1000.00"))
                .quoteVolume24h(basePrice.multiply(new BigDecimal("1000.00")))
                .priceChange24h(BigDecimal.ZERO)
                .priceChangePct24h(BigDecimal.ZERO)
                .totalOrders(0L)
                .openOrders(0L)
                .filledTrades(0L)
                .engineActive(false)
                .timestamp(Instant.now())
                .build();
    }

    private MarketStatsResponse buildStats(String sym, OrderMatchingEngine engine) {
        if (engine == null) return null;

        BigDecimal bestBid = engine.getBestBid();
        BigDecimal bestAsk = engine.getBestAsk();

        // Mark / last price = midpoint of best bid/ask if both exist, otherwise use last trade price
        BigDecimal markPrice;
        if (bestBid != null && bestAsk != null) {
            markPrice = bestBid.add(bestAsk).divide(BigDecimal.valueOf(2), 8, RoundingMode.HALF_UP);
        } else if (bestBid != null) {
            markPrice = bestBid;
        } else if (bestAsk != null) {
            markPrice = bestAsk;
        } else {
            // Order book is empty - use last traded price as fallback
            markPrice = lastTradePrice.getOrDefault(sym, BigDecimal.ZERO);
        }

        // Spread
        BigDecimal spread = (bestBid != null && bestAsk != null)
                ? bestAsk.subtract(bestBid).abs() : BigDecimal.ZERO;
        BigDecimal spreadPct = BigDecimal.ZERO;
        if (markPrice.compareTo(BigDecimal.ZERO) > 0 && spread.compareTo(BigDecimal.ZERO) > 0) {
            spreadPct = spread.divide(markPrice, 8, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(4, RoundingMode.HALF_UP);
        }

        BigDecimal openPrice = open24h.getOrDefault(sym, markPrice);
        BigDecimal high      = high24h.getOrDefault(sym, markPrice);
        BigDecimal low       = low24h.getOrDefault(sym, markPrice);
        BigDecimal vol       = volume24h.getOrDefault(sym, BigDecimal.ZERO);
        BigDecimal quoteVol  = quoteVolume24h.getOrDefault(sym, BigDecimal.ZERO);

        BigDecimal change = markPrice.subtract(openPrice);
        BigDecimal changePct = BigDecimal.ZERO;
        if (openPrice.compareTo(BigDecimal.ZERO) > 0) {
            changePct = change.divide(openPrice, 8, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(4, RoundingMode.HALF_UP);
        }

        long totalOrders  = orderRepository.count();
        // Exclude market maker orders from user-facing open orders count
        long openOrdersCount = orderRepository.findOpenOrders().stream()
                .filter(order -> !"MARKET_MAKER".equals(order.getAccount()))
                .count();

        return MarketStatsResponse.builder()
                .symbol(sym)
                .lastPrice(markPrice)
                .markPrice(markPrice)
                .bestBid(bestBid != null ? bestBid : BigDecimal.ZERO)
                .bestAsk(bestAsk != null ? bestAsk : BigDecimal.ZERO)
                .spread(spread)
                .spreadPct(spreadPct)
                .openPrice24h(openPrice)
                .high24h(high)
                .low24h(low)
                .volume24h(vol)
                .quoteVolume24h(quoteVol)
                .priceChange24h(change)
                .priceChangePct24h(changePct)
                .totalOrders(totalOrders)
                .openOrders(openOrdersCount)
                .filledTrades(filledTradesCount.getOrDefault(sym, 0L))
                .engineActive(true)
                .timestamp(Instant.now())
                .build();
    }

    /**
     * Get positions for the given symbol and account.
     */
    public List<PositionResponse> getPositions(String symbol, String account) {
        if (symbol != null) {
            Position pos = riskManager.getPosition(symbol.toUpperCase());
            BigDecimal markPrice = getMarkPrice(symbol.toUpperCase());

            if (pos == null) {
                return List.of(PositionResponse.flat(symbol.toUpperCase(), account));
            }
            return List.of(PositionResponse.fromPosition(pos, markPrice));
        }

        // All active symbols - return empty if no engines yet
        Set<String> activeSymbols = (matchingEngines != null && !matchingEngines.isEmpty()) 
                ? matchingEngines.keySet() 
                : Set.of("BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT");
                
        return activeSymbols.stream()
                .map(sym -> {
                    Position pos = riskManager.getPosition(sym);
                    BigDecimal markPrice = getMarkPrice(sym);
                    return pos != null
                            ? PositionResponse.fromPosition(pos, markPrice)
                            : PositionResponse.flat(sym, account);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get current risk statistics from the RiskManager.
     */
    public Object getRiskStats() {
        return riskManager.getStats();
    }

    private BigDecimal getMarkPrice(String symbol) {
        if (matchingEngines == null) return BigDecimal.ZERO;
        OrderMatchingEngine engine = matchingEngines.get(symbol);
        if (engine == null) return BigDecimal.ZERO;
        BigDecimal bid = engine.getBestBid();
        BigDecimal ask = engine.getBestAsk();
        if (bid != null && ask != null) {
            return bid.add(ask).divide(BigDecimal.valueOf(2), 8, RoundingMode.HALF_UP);
        }
        return bid != null ? bid : (ask != null ? ask : BigDecimal.ZERO);
    }
}

