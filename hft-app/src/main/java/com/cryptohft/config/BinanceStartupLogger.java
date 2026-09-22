package com.cryptohft.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Logs Binance configuration on startup.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BinanceStartupLogger {
    
    private final BinanceConfig binanceConfig;
    
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        log.info("═══════════════════════════════════════════════════════");
        log.info("Binance Configuration:");
        log.info("  Enabled: {}", binanceConfig.isEnabled());
        log.info("  Base URL: {}", binanceConfig.getBaseUrl());
        log.info("  API Key: {}", binanceConfig.getMaskedApiKey());
        log.info("  Configured: {}", binanceConfig.isConfigured());
        
        if (binanceConfig.isConfigured() && binanceConfig.isEnabled()) {
            log.info("✅ Binance API is ENABLED and CONFIGURED");
            log.info("   You can now place real orders on Binance Testnet");
        } else if (binanceConfig.isConfigured() && !binanceConfig.isEnabled()) {
            log.info("⚠️  Binance API is CONFIGURED but DISABLED");
            log.info("   Set BINANCE_TRADING_ENABLED=true to enable");
        } else {
            log.info("ℹ️  Binance API is NOT configured");
            log.info("   Platform running in demo mode");
        }
        log.info("═══════════════════════════════════════════════════════");
    }
}
