package com.cryptohft.api.dto;

import com.cryptohft.common.domain.Order;
import com.cryptohft.common.domain.Position;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

/**
 * Position and P&L response DTO.
 */
@Data
@Builder
public class PositionResponse {

    private String symbol;
    private String account;

    /** Net quantity: positive = long, negative = short, zero = flat */
    private BigDecimal quantity;

    /** Average entry price */
    private BigDecimal averageEntryPrice;

    /** Current mark price used for unrealized P&L calculation */
    private BigDecimal markPrice;

    /** Unrealized P&L at current mark price */
    private BigDecimal unrealizedPnl;

    /** Unrealized P&L as a percentage of notional */
    private BigDecimal unrealizedPnlPct;

    /** Realized P&L from closed portion of position */
    private BigDecimal realizedPnl;

    /** Total notional value of position (|qty| * markPrice) */
    private BigDecimal notionalValue;

    /** Direction: LONG, SHORT, or FLAT */
    private String direction;

    private Instant timestamp;

    /**
     * Build a PositionResponse from a Position domain object plus a current mark price.
     */
    public static PositionResponse fromPosition(Position position, BigDecimal markPrice) {
        if (position == null) {
            return null;
        }

        BigDecimal qty = position.getQuantity() != null ? position.getQuantity() : BigDecimal.ZERO;
        BigDecimal avgEntry = position.getAverageEntryPrice() != null ? position.getAverageEntryPrice() : BigDecimal.ZERO;
        BigDecimal mark = markPrice != null && markPrice.compareTo(BigDecimal.ZERO) > 0
                ? markPrice : avgEntry;

        // Unrealized P&L = (markPrice - avgEntry) * qty
        BigDecimal unrealizedPnl = BigDecimal.ZERO;
        if (mark.compareTo(BigDecimal.ZERO) > 0 && avgEntry.compareTo(BigDecimal.ZERO) > 0) {
            unrealizedPnl = mark.subtract(avgEntry).multiply(qty).setScale(8, RoundingMode.HALF_UP);
        }

        // Unrealized P&L % = unrealizedPnl / (avgEntry * |qty|) * 100
        BigDecimal unrealizedPnlPct = BigDecimal.ZERO;
        BigDecimal notional = avgEntry.multiply(qty.abs()).setScale(8, RoundingMode.HALF_UP);
        if (notional.compareTo(BigDecimal.ZERO) > 0) {
            unrealizedPnlPct = unrealizedPnl.divide(notional, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(4, RoundingMode.HALF_UP);
        }

        String direction;
        int cmp = qty.compareTo(BigDecimal.ZERO);
        if (cmp > 0) direction = "LONG";
        else if (cmp < 0) direction = "SHORT";
        else direction = "FLAT";

        // Notional value at mark price
        BigDecimal notionalAtMark = mark.multiply(qty.abs()).setScale(8, RoundingMode.HALF_UP);

        return PositionResponse.builder()
                .symbol(position.getSymbol())
                .account(position.getAccount())
                .quantity(qty)
                .averageEntryPrice(avgEntry)
                .markPrice(mark)
                .unrealizedPnl(unrealizedPnl)
                .unrealizedPnlPct(unrealizedPnlPct)
                .realizedPnl(position.getRealizedPnl() != null ? position.getRealizedPnl() : BigDecimal.ZERO)
                .notionalValue(notionalAtMark)
                .direction(direction)
                .timestamp(Instant.now())
                .build();
    }

    /**
     * Create a flat (empty) position response for a symbol with no trades yet.
     */
    public static PositionResponse flat(String symbol, String account) {
        return PositionResponse.builder()
                .symbol(symbol)
                .account(account)
                .quantity(BigDecimal.ZERO)
                .averageEntryPrice(BigDecimal.ZERO)
                .markPrice(BigDecimal.ZERO)
                .unrealizedPnl(BigDecimal.ZERO)
                .unrealizedPnlPct(BigDecimal.ZERO)
                .realizedPnl(BigDecimal.ZERO)
                .notionalValue(BigDecimal.ZERO)
                .direction("FLAT")
                .timestamp(Instant.now())
                .build();
    }
}

