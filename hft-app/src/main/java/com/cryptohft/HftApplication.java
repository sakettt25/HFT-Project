package com.cryptohft;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for the HFT Trading Platform.
 * Scans all cryptohft packages for components.
 */
@Slf4j
@SpringBootApplication
@EnableAsync
@EnableScheduling
@ComponentScan(basePackages = {
    "com.cryptohft",
    "com.cryptohft.api",
    "com.cryptohft.engine",
    "com.cryptohft.persistence"
})
public class HftApplication {
    
    public static void main(String[] args) {
        // Set system properties for optimal performance
        configureSystemProperties();
        
        SpringApplication app = new SpringApplication(HftApplication.class);
        var context = app.run(args);
        
        log.info("HFT Trading Platform started successfully");
        log.info("API available at: http://localhost:8080/api/v1");
        log.info("Health check: http://localhost:8080/actuator/health");
        
        // Log all REST controllers found
        String[] controllers = context.getBeanNamesForAnnotation(org.springframework.web.bind.annotation.RestController.class);
        log.info("Found {} REST Controllers:", controllers.length);
        for (String controller : controllers) {
            log.info("  - {}", controller);
        }
        
        // Log all request mappings
        var requestMappingHandlerMapping = context.getBean(
            "requestMappingHandlerMapping",
            org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping.class
        );
        requestMappingHandlerMapping.getHandlerMethods().forEach((key, value) -> {
            log.info("Mapped: {} -> {}", key, value);
        });
    }
    
    private static void configureSystemProperties() {
        // Disable JVM class verification for faster startup
        System.setProperty("java.security.egd", "file:/dev/./urandom");
        
        // Enable string deduplication
        // Note: Requires G1 GC: -XX:+UseG1GC -XX:+UseStringDeduplication
        
        // Agrona settings for off-heap memory
        System.setProperty("agrona.disable.bounds.checks", "true");
        
        // Aeron settings
        System.setProperty("aeron.term.buffer.sparse.file", "false");
        System.setProperty("aeron.pre.touch.mapped.memory", "true");
        
        log.info("System properties configured for optimal performance");
    }
}
