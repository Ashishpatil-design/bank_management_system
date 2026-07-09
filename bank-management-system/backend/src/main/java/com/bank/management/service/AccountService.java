package com.bank.management.service;

import com.bank.management.dto.AccountRequest;
import com.bank.management.exception.ResourceNotFoundException;
import com.bank.management.model.Account;
import com.bank.management.model.Customer;
import com.bank.management.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.List;

@Service
public class AccountService {

    private static final String DIGITS = "0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private CustomerService customerService;

    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    public Account getAccountById(Long id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + id));
    }

    public Account getAccountByNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with number: " + accountNumber));
    }

    public List<Account> getAccountsByCustomer(Long customerId) {
        return accountRepository.findByCustomerId(customerId);
    }

    public Account createAccount(AccountRequest request) {
        Customer customer = customerService.getCustomerById(request.getCustomerId());

        Account account = new Account();
        account.setAccountNumber(generateAccountNumber());
        account.setAccountType(request.getAccountType());
        account.setBalance(request.getInitialDeposit() == null ? 0.0 : request.getInitialDeposit());
        account.setCustomer(customer);

        return accountRepository.save(account);
    }

    public void deleteAccount(Long id) {
        Account account = getAccountById(id);
        accountRepository.delete(account);
    }

    private String generateAccountNumber() {
        String candidate;
        do {
            StringBuilder sb = new StringBuilder("AC");
            for (int i = 0; i < 10; i++) {
                sb.append(DIGITS.charAt(RANDOM.nextInt(DIGITS.length())));
            }
            candidate = sb.toString();
        } while (accountRepository.existsByAccountNumber(candidate));
        return candidate;
    }
}
