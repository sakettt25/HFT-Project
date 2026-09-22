package com.cryptohft.api.service;

import com.cryptohft.api.dto.OrderRequest;
import com.cryptohft.common.domain.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * Simple market maker that seeds the order book with initial liquidity.
 * Creates standing limit orders on both sides of the book for testing.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MarketMakerService {

    private final OrderService orderService;

    // Symbols to provide liquidity for
    private static final List<String> SYMBOLS = List.of(
            "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"
    );

    // Base prices for each symbol
    private static final java.util.Map<String, BigDecimal> BASE_PRICES = java.util.Map.of(
            "BTCUSDT", new BigDecimal("43000.00"),
            "ETHUSDT", new BigDecimal("2300.00"),
            "SOLUSDT", new BigDecimal("98.00"),
            "BNBUSDT", new BigDecimal("310.00"),
            "XRPUSDT", new BigDecimal("0.52")
    );

    /**
     * Seed the order book with initial liquidity after application startup.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void seedOrderBook() {
        log.info("🌱 Seeding order book with market maker liquidity...");
        
        // Give the application a moment to fully initialize
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        for (String symbol : SYMBOLS) {
            BigDecimal basePrice = BASE_PRICES.getOrDefault(symbol, new BigDecimal("100.00"));
            
            // Create 5 levels of bids and asks
            for (int level = 0; level < 5; level++) {
                BigDecimal spread = basePrice.multiply(new BigDecimal("0.001")); // 0.1% spread
                BigDecimal levelOffset = spread.multiply(BigDecimal.valueOf(level));
                
                // BUY orders (bids) below mid price
                BigDecimal bidPrice = basePrice.subtract(spread.divide(BigDecimal.valueOf(2), 8, java.math.RoundingMode.HALF_UP))
                        .subtract(levelOffset);
                BigDecimal bidQty = new BigDecimal("0.1").multiply(BigDecimal.valueOf(5 - level)); // Larger qty at better prices
                
                submitMarketMakerOrder(symbol, Order.Side.BUY, bidPrice, bidQty);
                
                // SELL orders (asks) above mid price
                BigDecimal askPrice = basePrice.add(spread.divide(BigDecimal.valueOf(2), 8, java.math.RoundingMode.HALF_UP))
                        .add(levelOffset);
                BigDecimal askQty = new BigDecimal("0.1").multiply(BigDecimal.valueOf(5 - level));
                
                submitMarketMakerOrder(symbol, Order.Side.SELL, askPrice, askQty);
            }
            
            log.info("✅ Seeded {} with 10 orders (5 bids, 5 asks) around ${}", 
                    symbol, basePrice);
        }

        log.info("✨ Market maker liquidity seeded successfully!");
    }

    private void submitMarketMakerOrder(String symbol, Order.Side side, BigDecimal price, BigDecimal quantity) {
        try {
            OrderRequest request = OrderRequest.builder()
                    .symbol(symbol)
                    .side(side)
                    .orderType(Order.OrderType.LIMIT)
                    .price(price)
                    .quantity(quantity)
                    .timeInForce(Order.TimeInForce.GTC)
                    .account("MARKET_MAKER")
                    .exchange("INTERNAL")
                    .build();

            var response = orderService.submitOrder(request);
            if (response.getStatus() == Order.OrderStatus.REJECTED) {
                log.warn("Market maker order REJECTED for {} {} @ {}: {}", 
                        side, symbol, price, response.getErrorMessage());
            } else {
                log.debug("Market maker order submitted: {} {} {} @ {}", 
                        side, quantity, symbol, price);
            }
        } catch (Exception e) {
            log.error("Failed to submit market maker order for {} {} @ {}: {}", 
                    side, symbol, price, e.getMessage(), e);
        }
    }
}
