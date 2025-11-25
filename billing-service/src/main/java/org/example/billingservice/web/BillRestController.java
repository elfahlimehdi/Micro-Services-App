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
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

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
    @Transactional(readOnly = true)
    public List<Bill> getBills(){
        return billRepository.findAll().stream()
                .map(this::enrichBillSafe)
                .collect(Collectors.toList());
    }

    @GetMapping(path = "/bills/{id}")
    @Transactional(readOnly = true)
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
            if (item.quantity() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La quantite doit etre positive pour le produit " + product.getName());
            }
            if (item.quantity() > product.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Stock insuffisant pour " + product.getName() + " (demande " + item.quantity() + ", disponible " + product.getQuantity() + ")");
            }
            int remaining = product.getQuantity() - item.quantity();
            product.setQuantity(remaining);
            // Mettre à jour le stock dans inventory-service
            productRestClient.updateProduct(product.getId(), product);

            ProductItem productItem = ProductItem.builder()
                    .bill(bill)
                    .productId(product.getId())
                    .quantity(item.quantity())
                    .unitPrice(product.getPrice())
                    .build();
            productItem.setProduct(product); // expose product details in response
            return productItemRepository.save(productItem);
        }).toList();

        bill.setProductItems(items);
        bill.setCustomer(customer);
        return bill;
    }

    @DeleteMapping(path = "/bills/{id}")
    public void deleteBill(@PathVariable Long id) {
        billRepository.findById(id).ifPresent(billRepository::delete);
    }

    private Bill enrichBill(Bill bill){
        bill.setCustomer(customerRestClient.getCustomerById(bill.getCustomerId()));
        bill.getProductItems().forEach(productItem ->
                productItem.setProduct(productRestClient.getProductById(productItem.getProductId()))
        );
        return bill;
    }

    private Bill enrichBillSafe(Bill bill) {
        try {
            return enrichBill(bill);
        } catch (Exception e) {
            // Si un service distant est indisponible ou renvoie 404, on retourne la facture brute
            return bill;
        }
    }

    public record CreateBillRequest(long customerId, List<CreateBillItem> items) { }
    public record CreateBillItem(String productId, int quantity) { }
}
