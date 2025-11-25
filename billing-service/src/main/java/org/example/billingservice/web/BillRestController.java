package org.example.billingservice.web;

import org.example.billingservice.entities.Bill;
import org.example.billingservice.entities.ProductItem;
import org.example.billingservice.feign.CustomerRestClient;
import org.example.billingservice.feign.ProductRestClient;
import org.example.billingservice.model.Customer;
import org.example.billingservice.model.Product;
import org.example.billingservice.repository.BillRepository;
import org.example.billingservice.repository.ProductItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
public class BillRestController {
    @Autowired
    private BillRepository billRepository;
    @Autowired
    private ProductItemRepository productItemRepository;
    @Autowired
    private CustomerRestClient customerRestClient;
    @Autowired
    private ProductRestClient productRestClient;

    @GetMapping(path = "/bills")
    public List<Bill> getBills(){
        return billRepository.findAll().stream()
                .map(this::enrichBill)
                .collect(Collectors.toList());
    }

    @GetMapping(path = "/bills/{id}")
    public Bill getBill(@PathVariable Long id){
        Bill bill = billRepository.findById(id).get();
        return enrichBill(bill);
    }

    @PostMapping(path = "/bills")
    public Bill createBill(@RequestBody CreateBillRequest request){
        if (request.items() == null || request.items().isEmpty()) {
            throw new IllegalArgumentException("Bill must contain at least one product item");
        }

        Customer customer = customerRestClient.getCustomerById(request.customerId());
        Bill bill = billRepository.save(Bill.builder()
                .billingDate(new Date())
                .customerId(customer.getId())
                .build());

        List<ProductItem> items = request.items().stream().map(item -> {
            Product product = productRestClient.getProductById(item.productId());
            ProductItem productItem = ProductItem.builder()
                    .bill(bill)
                    .productId(product.getId())
                    .quantity(item.quantity())
                    .unitPrice(product.getPrice())
                    .build();
            return productItemRepository.save(productItem);
        }).toList();

        bill.setProductItems(items);
        bill.setCustomer(customer);
        return bill;
    }

    private Bill enrichBill(Bill bill){
        bill.setCustomer(customerRestClient.getCustomerById(bill.getCustomerId()));
        bill.getProductItems().forEach(productItem -> {
            productItem.setProduct(productRestClient.getProductById(productItem.getProductId()));
        });
        return bill;
    }

    public record CreateBillRequest(long customerId, List<CreateBillItem> items) { }
    public record CreateBillItem(String productId, int quantity) { }
}

