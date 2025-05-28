package com.cryptoportfolio.service;

import com.cryptoportfolio.model.Portfolio;
import com.cryptoportfolio.model.PortfolioSnapshot;
import com.cryptoportfolio.repository.PortfolioRepository;
import com.cryptoportfolio.repository.PortfolioSnapshotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class PortfolioSnapshotService {

    @Autowired
    private PortfolioRepository portfolioRepository;

    @Autowired
    private PortfolioSnapshotRepository snapshotRepository;

    @Autowired
    private CoinGeckoService coinGeckoService;

    @Scheduled(fixedRate = 300000) // Run every 5 minutes
    public void takeSnapshots() {
        portfolioRepository.findAll().forEach(portfolio -> {
            if (portfolio.getHoldings() != null && !portfolio.getHoldings().isEmpty()) {
                createSnapshot(portfolio);
            }
        });
    }

    private void createSnapshot(Portfolio portfolio) {
        try {
            Map<String, Double> holdings = portfolio.getHoldings();
            List<String> coins = holdings.keySet().stream().toList();

            // Get market data for all held coins
            coinGeckoService.getMarketData(coins, "usd")
                .collectList()
                .subscribe(prices -> {
                    try {
                        PortfolioSnapshot snapshot = new PortfolioSnapshot();
                        snapshot.setUserId(portfolio.getUserId());
                        snapshot.setTimestamp(Instant.now());

                        Map<String, PortfolioSnapshot.CoinSnapshot> snapshotHoldings = new HashMap<>();
                        AtomicReference<Double> totalValue = new AtomicReference<>(0.0);

                        prices.forEach(price -> {
                            double amount = holdings.getOrDefault(price.getSymbol().toUpperCase(), 0.0);
                            if (amount > 0) {
                                // Convert BigDecimal to double for storage
                                double priceValue = price.getCurrentPrice().doubleValue();
                                PortfolioSnapshot.CoinSnapshot coinSnapshot =
                                    new PortfolioSnapshot.CoinSnapshot(amount, priceValue);
                                snapshotHoldings.put(price.getSymbol().toUpperCase(), coinSnapshot);
                                totalValue.updateAndGet(current -> current + coinSnapshot.getValue());
                            }
                        });

                        // Handle any coins that didn't get prices (maintain last known price if possible)
                        holdings.forEach((symbol, amount) -> {
                            if (!snapshotHoldings.containsKey(symbol)) {
                                // Try to get the last known price from previous snapshot
                                PortfolioSnapshot lastSnapshot = getLatestSnapshot(portfolio.getUserId());
                                if (lastSnapshot != null &&
                                    lastSnapshot.getHoldings() != null &&
                                    lastSnapshot.getHoldings().containsKey(symbol)) {
                                    PortfolioSnapshot.CoinSnapshot lastCoin =
                                        lastSnapshot.getHoldings().get(symbol);
                                    PortfolioSnapshot.CoinSnapshot newCoin =
                                        new PortfolioSnapshot.CoinSnapshot(amount, lastCoin.getPriceUsd());
                                    snapshotHoldings.put(symbol, newCoin);
                                    totalValue.updateAndGet(current -> current + newCoin.getValue());
                                }
                            }
                        });

                        snapshot.setHoldings(snapshotHoldings);
                        snapshot.setTotalValue(totalValue.get());

                        // Log the snapshot before saving
                        System.out.println("Creating snapshot for user " + portfolio.getUserId() +
                                           " at " + Instant.now() +
                                           " with total value: " + totalValue.get());

                        snapshotRepository.save(snapshot);

                        // Log after save to verify it's completed
                        System.out.println("Saved snapshot for user " + portfolio.getUserId());
                    } catch (Exception e) {
                        // Log any errors in the subscription callback
                        System.err.println("Error creating snapshot: " + e.getMessage());
                        e.printStackTrace();
                    }
                }, error -> {
                    // Handle errors from the reactive chain
                    System.err.println("Error getting market data for snapshot: " + error.getMessage());
                    error.printStackTrace();
                });
        } catch (Exception e) {
            // Log error but don't throw to prevent disrupting the scheduler
            System.err.println("Unexpected error in createSnapshot: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public List<PortfolioSnapshot> getSnapshots(String userId, String timeRange) {
        Instant since = switch (timeRange) {
            case "1h" -> Instant.now().minus(1, ChronoUnit.HOURS);
            case "24h" -> Instant.now().minus(24, ChronoUnit.HOURS);
            case "7d" -> Instant.now().minus(7, ChronoUnit.DAYS);
            case "30d" -> Instant.now().minus(30, ChronoUnit.DAYS);
            case "90d" -> Instant.now().minus(90, ChronoUnit.DAYS);
            default -> Instant.now().minus(24, ChronoUnit.HOURS);
        };
        
        return snapshotRepository.findByUserIdAndTimestampAfter(userId, since);
    }

    public PortfolioSnapshot getLatestSnapshot(String userId) {
        List<PortfolioSnapshot> latest = snapshotRepository.findLatestByUserId(userId, PageRequest.of(0, 1));
        return latest.isEmpty() ? null : latest.get(0);
    }
}
