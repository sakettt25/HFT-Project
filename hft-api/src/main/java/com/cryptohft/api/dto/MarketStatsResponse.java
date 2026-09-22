package com.cryptohft.api.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Market statistics response DTO for 24h data.
 */
@Data
@Builder
public class MarketStatsResponse {

    private String symbol;

    /** Last traded price (best bid from matching engine) */
    private BigDecimal lastPrice;

    /** Mark / mid price */
    private BigDecimal markPrice;

    /** Best bid price */
    private BigDecimal bestBid;

    /** Best ask price */
    private BigDecimal bestAsk;

    /** Bid-ask spread */
    private BigDecimal spread;

    /** Bid-ask spread as a percentage of mid price */
    private BigDecimal spreadPct;

    /** 24-hour open price (estimated from order history) */
    private BigDecimal openPrice24h;

    /** 24-hour high price */
    private BigDecimal high24h;

    /** 24-hour low price */
    private BigDecimal low24h;

    /** 24-hour volume in base currency */
    private BigDecimal volume24h;

    /** 24-hour volume in quote currency */
    private BigDecimal quoteVolume24h;

    /** Absolute price change over 24 hours */
    private BigDecimal priceChange24h;

    /** Percentage price change over 24 hours */
    private BigDecimal priceChangePct24h;

    /** Total number of orders in the system */
    private long totalOrders;

    /** Number of open/active orders */
    private long openOrders;

    /** Number of filled trades in the engine */
    private long filledTrades;

    /** Whether the matching engine is active for this symbol */
    private boolean engineActive;

    /** Snapshot timestamp */
    private Instant timestamp;
}

