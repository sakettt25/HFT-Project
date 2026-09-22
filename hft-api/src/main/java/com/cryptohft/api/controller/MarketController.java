package com.cryptohft.api.controller;

import com.cryptohft.api.dto.MarketStatsResponse;
import com.cryptohft.api.dto.PositionResponse;
import com.cryptohft.api.service.MarketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for market statistics and account positions.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class MarketController {

    private final MarketService marketService;

    /**
     * Get 24h market statistics for a symbol.
     * If no symbol is provided, returns stats for all active symbols.
     *
     * GET /api/v1/market/stats?symbol=BTCUSDT
     */
    @GetMapping("/market/stats")
    public ResponseEntity<List<MarketStatsResponse>> getMarketStats(
            @RequestParam(required = false) String symbol) {
        log.debug("Market stats requested for symbol={}", symbol);
        List<MarketStatsResponse> stats = marketService.getMarketStats(symbol);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get position for a specific symbol and account.
     *
     * GET /api/v1/account/positions?symbol=BTCUSDT&account=DEFAULT
     */
    @GetMapping("/account/positions")
    public ResponseEntity<List<PositionResponse>> getPositions(
            @RequestParam(required = false) String symbol,
            @RequestParam(defaultValue = "DEFAULT") String account) {
        log.debug("Positions requested for symbol={}, account={}", symbol, account);
        List<PositionResponse> positions = marketService.getPositions(symbol, account);
        return ResponseEntity.ok(positions);
    }

    /**
     * Get overall risk stats (P&L, order counts, circuit breaker status).
     *
     * GET /api/v1/account/risk
     */
    @GetMapping("/account/risk")
    public ResponseEntity<Object> getRiskStats() {
        return ResponseEntity.ok(marketService.getRiskStats());
    }
}

