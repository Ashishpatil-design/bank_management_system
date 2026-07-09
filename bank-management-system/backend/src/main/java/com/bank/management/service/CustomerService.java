package com.bank.management.service;

import com.bank.management.exception.DuplicateResourceException;
import com.bank.management.exception.ResourceNotFoundException;
import com.bank.management.model.Customer;
import com.bank.management.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Customer getCustomerById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
    }

    public Customer createCustomer(Customer customer) {
        if (customerRepository.existsByEmail(customer.getEmail())) {
            throw new DuplicateResourceException("A customer with this email already exists");
        }
        return customerRepository.save(customer);
    }

    public Customer updateCustomer(Long id, Customer updated) {
        Customer existing = getCustomerById(id);
        existing.setFullName(updated.getFullName());
        existing.setPhone(updated.getPhone());
        existing.setAddress(updated.getAddress());
        if (!existing.getEmail().equals(updated.getEmail())) {
            if (customerRepository.existsByEmail(updated.getEmail())) {
                throw new DuplicateResourceException("A customer with this email already exists");
            }
            existing.setEmail(updated.getEmail());
        }
        return customerRepository.save(existing);
    }

    public void deleteCustomer(Long id) {
        Customer existing = getCustomerById(id);
        customerRepository.delete(existing);
    }
}
