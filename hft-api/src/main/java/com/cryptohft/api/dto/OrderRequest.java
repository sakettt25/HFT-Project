package com.cryptohft.api.dto;

import com.cryptohft.common.domain.Order;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Order request DTO.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {
    
    @NotBlank(message = "Symbol is required")
    private String symbol;
    
    @NotNull(message = "Side is required")
    private Order.Side side;
    
    @NotNull(message = "Order type is required")
    private Order.OrderType orderType;
    
    @Builder.Default
    private Order.TimeInForce timeInForce = Order.TimeInForce.GTC;
    
    private BigDecimal price;
    
    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private BigDecimal quantity;
    
    private BigDecimal stopPrice;
    
    private String clientOrderId;
    
    private String account;
    
    private String exchange;
}
