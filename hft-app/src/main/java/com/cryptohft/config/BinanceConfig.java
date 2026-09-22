package com.cryptohft.config;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

/**
 * Binance API configuration.
 * Handles API key, secret, and HMAC-SHA256 signature generation.
 */
@Slf4j
@Data
@Configuration
@ConfigurationProperties(prefix = "hft.binance")
public class BinanceConfig {
    
    private String apiKey;
    private String secretKey;
    private String baseUrl = "https://testnet.binance.vision";
    private boolean enabled = false;
    
    /**
     * Generate HMAC-SHA256 signature for Binance API requests.
     */
    public String generateSignature(String queryString) {
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                secretKey.getBytes(StandardCharsets.UTF_8), 
                "HmacSHA256"
            );
            sha256Hmac.init(secretKeySpec);
            byte[] hash = sha256Hmac.doFinal(queryString.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            log.error("Failed to generate signature", e);
            throw new RuntimeException("Failed to generate Binance signature", e);
        }
    }
    
    /**
     * Check if Binance API is properly configured.
     */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isEmpty() 
            && secretKey != null && !secretKey.isEmpty();
    }
    
    /**
     * Mask API key for logging (show first 4 and last 3 characters).
     */
    public String getMaskedApiKey() {
        if (apiKey == null || apiKey.length() < 10) {
            return "****";
        }
        return apiKey.substring(0, 4) + "****" + apiKey.substring(apiKey.length() - 3);
    }
}
