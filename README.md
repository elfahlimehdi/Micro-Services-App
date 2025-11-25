# Vue globale du projet 

Ensemble Spring Cloud (Eureka, Config Server, Gateway, microservices metier) + front Angular. Ce repo contient tout le stack : services Java, depot de config et UI.

## Contenu du Repo
- discovery-service/ : serveur Eureka (8761).
- config-service/ : Spring Cloud Config Server (9999) avec backend natif `config-repo/`.
- config-repo/ : fichiers de configuration charges au demarrage.
- gateway-service/ : Spring Cloud Gateway (8888) avec discovery locator active.
- customer-service/ : Spring Data REST + H2, clients d'exemple (8081).
- inventory-service/ : Spring Data REST + H2, produits d'exemple (8083).
- billing-service/ : Spring Web + JPA + OpenFeign, facture en se basant sur customers/products (8082).
- ecom-web-app/ : front Angular Material (dev server 4200) qui consomme via la gateway.
- .mvn/, pom.xml : build Maven parent.

## Architecture 
- Decouverte : tous les services (gateway incluse) s'enregistrent dans Eureka.
- Configuration : config-service sert les properties depuis `../config-repo`.
- Routage : gateway utilise le discovery locator (IDs en lowercase) pour exposer `/customer-service/**`, `/inventory-service/**`, `/billing-service/**`.
- Donnees : chaque service utilise H2 en memoire, population d'exemple au demarrage (donnees perdues apres restart).
- Communication : billing-service appelle customer/inventory via OpenFeign.

## Diagrammes (ASCII, compatibles GitHub)

### Vue globale (front + backend)
```
                         +--------------------------+
                         |  ecom-web-app (4200)     |
                         |  Angular / Material      |
                         +------------+-------------+
                                      |
                                      v
                         +------------+-------------+
                         | gateway-service (8888)   |
                         | Spring Cloud Gateway     |
+------------------------+----+----------+----+-----------------------+
|                             |          |                          |
|                             |          |                          |
|                             |          |                          |
|                             v          v                          v
|                    +--------+--+  +----+-------+         +--------+--------+
|                    |customer   |  |inventory  |         | billing-service  |
|                    |service    |  |service    |         | (8082) Feign     |
|                    |(8081) REST|  |(8083) REST|         | vers cust/inv    |
|                    +-----+-----+  +----+------+         +---------+--------+
|                          |             |                          |
+--------------------------+-------------+--------------------------+--------+
                           |             |                          |
                           v             v                          v
                   discovery-service  discovery-service      discovery-service
                     (8761, Eureka)    (8761, Eureka)         (8761, Eureka)
                           |             |                          |
                           +-------------+--------------------------+
                                         |
                                         v
                             config-service (9999)
                             backend natif: config-repo
```

### Diagramme de classes (par service)
```
Customer-service (8081)           Inventory-service (8083)         Billing-service (8082)
+-----------+                     +-----------+                    +-----------+
| Customer  |                     | Product   |                    | Bill      |
+-----------+                     +-----------+                    +-----------+
| id  (PK)  |                     | id  (PK)  |                    | id (PK)   |
| name      |                     | name      |                    | billingDate|
| email     |                     | price     |                    | customerId |
+-----------+                     | quantity  |                    +-----------+
                                  +-----------+                    | ProductItem|
                                                                  | id (PK)    |
Associations (cross-services)                                    | productId  |
- Bill.customerId -> Customer (Feign)                            | billId     |
- ProductItem.productId -> Product (Feign)                       | quantity   |
- Bill 1..* ProductItem (JPA)                                    | unitPrice  |
                                                                  +-----------+
```

### Diagramme de sequence (creation d'une facture)
```
Front (ecom-web-app)
    |
    | POST /bills { customerId, items[] } via gateway
    v
Gateway (8888)
    |
    | route -> billing-service /bills
    v
Billing-service (8082)
    |-- GET /customers/{id} ------------------> Customer-service (8081)
    |<--------------------- customer ----------|
    |-- GET /products/{id} pour chaque item --> Inventory-service (8083)
    |<--------------------- product -----------|
    | persiste Bill + ProductItems (H2)
    | enrichit la reponse (customer + products)
    v
Gateway
    v
Front (affiche la facture)
```

## Captures d'ecran (placeholders)
- ecom-web-app (UI)
- <img width="2850" height="882" alt="image" src="https://github.com/user-attachments/assets/bfbb8cda-ccc4-4a59-af51-dd7b0ef01a27" />
<img width="1308" height="911" alt="image" src="https://github.com/user-attachments/assets/12de810e-b9e9-4f86-896e-c906eba527fc" />
<img width="2856" height="984" alt="image" src="https://github.com/user-attachments/assets/0bed542b-d9cb-48bd-a269-c02220c57ab1" />
<img width="2870" height="1309" alt="Capture d&#39;écran 2025-11-26 004142" src="https://github.com/user-attachments/assets/2da62281-92cf-49ba-87ed-ac0af7e758f4" />
<img width="2846" height="1394" alt="Capture d&#39;écran 2025-11-26 004149" src="https://github.com/user-attachments/assets/c97a07b9-bd6c-4dcc-97cd-3f8164c6e267" />
<img width="2829" height="1567" alt="Capture d&#39;écran 2025-11-26 004213" src="https://github.com/user-attachments/assets/e4738103-a50c-4504-84a3-f967dabee81e" />
<img width="2839" height="1571" alt="Capture d&#39;écran 2025-11-26 004220" src="https://github.com/user-attachments/assets/f44ece7d-1da8-4022-9ece-1778cf993265" />
<img width="2825" height="1565" alt="Capture d&#39;écran 2025-11-26 004235" src="https://github.com/user-attachments/assets/d5d9d572-e25c-42aa-88de-b7dfe4f5f252" />
<img width="2854" height="959" alt="Capture d&#39;écran 2025-11-26 004240" src="https://github.com/user-attachments/assets/47ebd862-2057-496e-a74a-d177dd194a82" />



- customer-service (API/console):
- <img width="1075" height="1724" alt="image" src="https://github.com/user-attachments/assets/3e35bc37-f9aa-42c4-b5f1-06d1db5b4011" />

- inventory-service (API/console):
- <img width="1384" height="1694" alt="image" src="https://github.com/user-attachments/assets/b3077fe2-cbc7-4f31-8187-f655bb45fee7" />

- billing-service (API/console):
  - <img width="918" height="1693" alt="Capture d&#39;écran 2025-11-25 235326" src="https://github.com/user-attachments/assets/50fba147-bc90-4914-906a-9ad2611a2552" />

- discovery-service (Eureka dashboard):
  - <img width="2830" height="1390" alt="Capture d&#39;écran 2025-11-25 233020" src="https://github.com/user-attachments/assets/f21f6f95-cae4-4f50-bea2-008a9241f218" />
  
- config-service (actuator/health):
- <img width="1015" height="273" alt="image" src="https://github.com/user-attachments/assets/8c46ff32-d3fc-4b2d-8dae-c9f308a042ee" />


## Prerequis
- Java 21
- Maven 3.9+
- Node.js 20+ et npm
- Ports libres : 8761, 8888, 9999, 8081, 8082, 8083, 4200.

## Demarrage local (par ordre )
Ouvrir plusieurs terminaux depuis la racine du projet.

1) Discovery :
```bash
cd discovery-service
mvn spring-boot:run
```

2) Config :
```bash
cd config-service
mvn spring-boot:run
```

3) Services metier (apres que discovery + config soient up) :
```bash
cd customer-service   && mvn spring-boot:run
cd inventory-service  && mvn spring-boot:run
cd billing-service    && mvn spring-boot:run
```

4) Gateway :
```bash
cd gateway-service
mvn spring-boot:run
```

5) Front-end (dev) :
```bash
cd ecom-web-app
npm install
npm start
```
ANGULAR tourne sur http://localhost:4200 et interroge la gateway en http://localhost:8888.

## URLs utiles
- Eureka dashboard : http://localhost:8761/
- Config Server health : http://localhost:9999/actuator/health
-  Clients : http://localhost:8081/api/customers
-  Produits : http://localhost:8083/api/products
-  Factures : http://localhost:8082/bills
- Front-end  : http://localhost:4200/

## Notes operationnelles
- CORS : autoriser le front (port 4200) sur la gateway/les services si besoin.
- Config path : en conteneurisation/CI, ajuster le backend `file:../config-repo` selon le layout.
- Donnees : H2 en memoire, les seeds sont recrees a chaque demarrage.
- Tests : principalement des tests de chargement de contexte ; ajouter des tests d'API/integration pour fiabiliser.
