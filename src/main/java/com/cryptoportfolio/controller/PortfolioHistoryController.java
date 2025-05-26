package com.cryptoportfolio.controller;

import com.cryptoportfolio.model.PortfolioSnapshot;
import com.cryptoportfolio.service.PortfolioSnapshotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/portfolio/history")
@CrossOrigin(origins = "http://localhost:8090")
public class PortfolioHistoryController {

    @Autowired
    private PortfolioSnapshotService snapshotService;

    @GetMapping("/{userId}")
    public ResponseEntity<List<PortfolioSnapshot>> getHistory(
            @PathVariable String userId,
            @RequestParam(defaultValue = "24h") String timeRange) {
        return ResponseEntity.ok(snapshotService.getSnapshots(userId, timeRange));
    }

    @GetMapping("/{userId}/latest")
    public ResponseEntity<PortfolioSnapshot> getLatest(@PathVariable String userId) {
        PortfolioSnapshot latest = snapshotService.getLatestSnapshot(userId);
        if (latest == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(latest);
    }
} 