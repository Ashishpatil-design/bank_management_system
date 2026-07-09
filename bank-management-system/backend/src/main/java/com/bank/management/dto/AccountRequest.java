package com.bank.management.dto;

import com.bank.management.model.AccountType;
import jakarta.validation.constraints.NotNull;

public class AccountRequest {

    @NotNull(message = "Customer id is required")
    private Long customerId;

    @NotNull(message = "Account type is required")
    private AccountType accountType;

    private Double initialDeposit = 0.0;

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public void setAccountType(AccountType accountType) {
        this.accountType = accountType;
    }

    public Double getInitialDeposit() {
        return initialDeposit;
    }

    public void setInitialDeposit(Double initialDeposit) {
        this.initialDeposit = initialDeposit;
    }
}
