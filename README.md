# Suite de microservices e-commerce

Ensemble Spring Cloud + front Angular : découverte de services, configuration centralisée, passerelle d'API et orchestration de facturation.

## Vue d'ensemble
- Découverte : `discovery-service` (Eureka) pour l'enregistrement et la recherche.
- Configuration : `config-service` avec dépôt natif `config-repo`.
- Passerelle : `gateway-service` (Spring Cloud Gateway) devant les services métiers.
- Services métiers :
  - `customer-service` : CRUD clients via Spring Data REST, données d'exemple au démarrage.
  - `inventory-service` : CRUD produits via Spring Data REST, données d'exemple au démarrage.
  - `billing-service` : agrège clients/produits, crée des factures avec OpenFeign.
- Front-end : `ecom-web-app` (Angular Material) consommant les APIs via la passerelle.

## Schéma d'architecture
```mermaid
graph TD
    UI[Front Angular\n(ecom-web-app)] -->|HTTP| GW[API Gateway\n(8888)]
    GW --> CUS[customer-service\n(8081)]
    GW --> INV[inventory-service\n(8083)]
    GW --> BIL[billing-service\n(8082)]

    CUS --- EKA[discovery-service\n(Eureka 8761)]
    INV --- EKA
    BIL --- EKA
    GW --- EKA

    CFG[config-service\n(9999)] --> REP[config-repo\n(fichiers natifs)]
    CFG -. config -> CUS
    CFG -. config -> INV
    CFG -. config -> BIL
    CFG -. config -> GW
```

## Structure du dépôt
```
ecom-app-bdcc-ii/
- config-repo/         (fichiers de config consommés par config-service)
- config-service/      (Config Server)
- discovery-service/   (Eureka Server)
- gateway-service/     (API Gateway)
- customer-service/    (service clients)
- inventory-service/   (service produits)
- billing-service/     (service facturation)
- ecom-web-app/        (UI Angular)
- src/                 (stub IntelliJ, non utilisé)
```

## Détail des services

### discovery-service
- Stack : Spring Boot 3.5.x, Spring Cloud 2025.x (Eureka Server).
- Port : 8761.
- Rôle : registre des clients. Pas de base de données.

### config-service
- Stack : Spring Boot 3.5.x, Spring Cloud Config Server.
- Port : 9999.
- Backend : dépôt natif `../config-repo`.
- Contenu : propriétés globales et spécifiques par service (`customer-service.properties`, `inventory-service.properties`, `billing-service.properties`, variantes dev/prod).

### gateway-service
- Stack : Spring Cloud Gateway, client Eureka.
- Port : 8888.
- Routage : locator de découverte (`DiscoveryClientRouteDefinitionLocator`). Activer `spring.cloud.gateway.discovery.locator.enabled=true` et `spring.cloud.gateway.discovery.locator.lower-case-service-id=true` pour exposer `/customer-service/**`, `/inventory-service/**`, `/billing-service/**`.

### customer-service
- Stack : Spring Data REST, JPA (H2 en mémoire), clients Eureka/Config.
- Port : 8081.
- Données : 3 clients pré-chargés au démarrage.
- API : `/api/customers` (IDs exposées). Projections `all` et `email`.
- Bonus : `/testConfig1`, `/testConfig2` pour vérifier la config externalisée.

### inventory-service
- Stack : Spring Data REST, JPA (H2 en mémoire), clients Eureka/Config.
- Port : 8083.
- Données : 3 produits (IDs UUID) pré-chargés.
- API : `/api/products` (IDs exposées).

### billing-service
- Stack : Spring Web + Data JPA (H2), OpenFeign, clients Eureka/Config.
- Port : 8082.
- Démarrage : récupère clients/produits via Feign et génère des factures + lignes.
- API `/bills` :
  - `GET /bills` : liste enrichie (client + produit).
  - `GET /bills/{id}` : détail enrichi.
  - `POST /bills` : création `{ customerId, items: [{ productId, quantity }] }`.

### ecom-web-app (Angular)
- Stack : Angular standalone + Angular Material.
- Consommation via passerelle `http://localhost:8888/*`.
- Routes : `/products`, `/products/new`, `/products/edit/:id`, `/customers`, `/bills`.
- Fonctionnalités : CRUD produits, liste clients, création/liste factures.

## Lancement local (ordre conseillé)
1) Discovery : `cd discovery-service && mvn spring-boot:run`
2) Config : `cd config-service && mvn spring-boot:run`
3) Services métiers (une fois discovery+config prêts) :
   - `customer-service` : `mvn spring-boot:run`
   - `inventory-service` : `mvn spring-boot:run`
   - `billing-service` : `mvn spring-boot:run`
4) Gateway : `cd gateway-service && mvn spring-boot:run`
5) Front-end : `cd ecom-web-app && npm install && npm start` (Angular dev server sur 4200).

Notes :
- Chaque service utilise H2 en mémoire ; données perdues au redémarrage.
- Le peuplement de billing nécessite customer/inventory déjà disponibles.
- Activer CORS sur la passerelle/les services pour les appels depuis le dev server Angular.

## Ports & URLs (défaut)
- Discovery : http://localhost:8761/
- Config Server : http://localhost:9999/
- Gateway : http://localhost:8888/
- API Clients : http://localhost:8081/api/customers
- API Produits : http://localhost:8083/api/products
- API Facturation : http://localhost:8082/bills
- Angular (dev) : http://localhost:4200/

## Dépendances
- Java 21.
- Spring Boot 3.5.x, Spring Cloud 2025.x.
- H2 en mémoire.
- OpenFeign pour les appels cross-service.
- Angular + Material, parsing HAL pour Spring Data REST.

## Points opérationnels
- CORS : nécessaire pour le front (port 4200).
- Découverte Gateway : vérifier les propriétés locator activées.
- Chemin de config `file:../config-repo` dépend du layout ; adapter en conteneurisation.
- Tests : uniquement stubs de chargement de contexte ; ajouter des tests d'API/intégration pour la fiabilité.

## Modèle de données (rapide)
- Customer : `id`, `name`, `email`.
- Product : `id` (UUID), `name`, `price`, `quantity`.
- Bill : `id`, `billingDate`, `customerId`, `productItems[]`.
- ProductItem : `id`, `productId`, `quantity`, `unitPrice`.

## Astuces de développement
- Démarrer discovery + config en premier pour éviter les erreurs Feign/config.
- Ajuster les URLs d'API Angular via les fichiers d'environnement si le host/port gateway change.
- Si des caractères apparaissent corrompus dans l'UI, vérifier l'encodage UTF-8 des fichiers et corriger les libellés.
