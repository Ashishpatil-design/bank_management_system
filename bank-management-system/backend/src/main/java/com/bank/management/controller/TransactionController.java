package com.bank.management.controller;

import com.bank.management.dto.DepositWithdrawRequest;
import com.bank.management.dto.TransferRequest;
import com.bank.management.model.Transaction;
import com.bank.management.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionService.getAllTransactions();
    }

    @GetMapping("/account/{accountId}")
    public List<Transaction> getTransactionsForAccount(@PathVariable Long accountId) {
        return transactionService.getTransactionsForAccount(accountId);
    }

    @PostMapping("/deposit")
    public ResponseEntity<Transaction> deposit(@Valid @RequestBody DepositWithdrawRequest request) {
        Transaction t = transactionService.deposit(request);
        return new ResponseEntity<>(t, HttpStatus.CREATED);
    }

    @PostMapping("/withdraw")
    public ResponseEntity<Transaction> withdraw(@Valid @RequestBody DepositWithdrawRequest request) {
        Transaction t = transactionService.withdraw(request);
        return new ResponseEntity<>(t, HttpStatus.CREATED);
    }

    @PostMapping("/transfer")
    public ResponseEntity<Map<String, String>> transfer(@Valid @RequestBody TransferRequest request) {
        transactionService.transfer(request);
        return new ResponseEntity<>(Map.of("message", "Transfer completed successfully"), HttpStatus.CREATED);
    }
}
