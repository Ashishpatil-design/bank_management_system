package com.bank.management.service;

import com.bank.management.dto.DepositWithdrawRequest;
import com.bank.management.dto.TransferRequest;
import com.bank.management.exception.InsufficientBalanceException;
import com.bank.management.model.Account;
import com.bank.management.model.Transaction;
import com.bank.management.model.TransactionType;
import com.bank.management.repository.AccountRepository;
import com.bank.management.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TransactionService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AccountService accountService;

    @Transactional
    public Transaction deposit(DepositWithdrawRequest request) {
        Account account = accountService.getAccountByNumber(request.getAccountNumber());
        account.setBalance(account.getBalance() + request.getAmount());
        accountRepository.save(account);

        Transaction transaction = new Transaction(account, TransactionType.DEPOSIT,
                request.getAmount(), account.getBalance(),
                request.getDescription() == null ? "Cash deposit" : request.getDescription());
        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction withdraw(DepositWithdrawRequest request) {
        Account account = accountService.getAccountByNumber(request.getAccountNumber());
        if (account.getBalance() < request.getAmount()) {
            throw new InsufficientBalanceException("Insufficient balance in account " + account.getAccountNumber());
        }
        account.setBalance(account.getBalance() - request.getAmount());
        accountRepository.save(account);

        Transaction transaction = new Transaction(account, TransactionType.WITHDRAWAL,
                request.getAmount(), account.getBalance(),
                request.getDescription() == null ? "Cash withdrawal" : request.getDescription());
        return transactionRepository.save(transaction);
    }

    @Transactional
    public void transfer(TransferRequest request) {
        if (request.getFromAccountNumber().equals(request.getToAccountNumber())) {
            throw new IllegalArgumentException("Source and destination accounts must be different");
        }

        Account from = accountService.getAccountByNumber(request.getFromAccountNumber());
        Account to = accountService.getAccountByNumber(request.getToAccountNumber());

        if (from.getBalance() < request.getAmount()) {
            throw new InsufficientBalanceException("Insufficient balance in account " + from.getAccountNumber());
        }

        from.setBalance(from.getBalance() - request.getAmount());
        to.setBalance(to.getBalance() + request.getAmount());

        accountRepository.save(from);
        accountRepository.save(to);

        String desc = request.getDescription() == null ? "Fund transfer" : request.getDescription();

        transactionRepository.save(new Transaction(from, TransactionType.TRANSFER_OUT,
                request.getAmount(), from.getBalance(), desc + " to " + to.getAccountNumber()));
        transactionRepository.save(new Transaction(to, TransactionType.TRANSFER_IN,
                request.getAmount(), to.getBalance(), desc + " from " + from.getAccountNumber()));
    }

    public List<Transaction> getTransactionsForAccount(Long accountId) {
        return transactionRepository.findByAccountIdOrderByTimestampDesc(accountId);
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }
}
