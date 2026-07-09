# Ledger & Vault — Bank Management System

A full-stack bank management system:

- **Backend:** Java 17, Spring Boot 3, Spring Data JPA, MySQL
- **Frontend:** Plain HTML, CSS, JavaScript (no build step — just open in a browser)

Features: customer registration, account opening (Savings/Current), deposits,
withdrawals, transfers between accounts, transaction history, and a live
dashboard.

```
bank-management-system/
├── backend/                 ← Spring Boot API (run this in VS Code / IntelliJ)
│   ├── pom.xml
│   ├── src/main/java/com/bank/management/...
│   ├── src/main/resources/application.properties
│   └── database/schema.sql  (reference only, auto-created by Hibernate)
├── frontend/                ← Static site (open index.html or use Live Server)
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
└── README.md
```

## 1. Prerequisites

Install these first:

- **Java 17+** (JDK) — `java -version`
- **Maven** (or use the included Maven wrapper if you generate one — instructions below use plain `mvn`)
- **MySQL 8+** running locally, with a root password you know
- **VS Code** with the **Extension Pack for Java** and **Spring Boot Extension Pack** (recommended)

## 2. Set up the database

You don't need to manually create tables — Hibernate does it for you on
startup (`spring.jpa.hibernate.ddl-auto=update`). You only need the
**database itself** to exist, and the app will even create that for you via
`createDatabaseIfNotExist=true` in the JDBC URL, as long as your MySQL user
has permission.

Just make sure MySQL is running:

```bash
# macOS (Homebrew)
brew services start mysql

# Windows: start the "MySQL80" service from Services, or via MySQL Installer

# Linux
sudo systemctl start mysql
```

## 3. Configure your MySQL credentials

Open `backend/src/main/resources/application.properties` and update the
username/password to match your local MySQL setup:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/bank_management_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=root
```

## 4. Run the backend

**Option A — VS Code**

1. Open the `backend` folder in VS Code (`File → Open Folder → bank-management-system/backend`).
2. Let the Java extensions index the project.
3. Open `src/main/java/com/bank/management/BankManagementApplication.java`.
4. Click **Run** above the `main` method (or press `F5`).
5. The API starts on **http://localhost:8080**.

**Option B — terminal**

```bash
cd bank-management-system/backend
mvn spring-boot:run
```

Confirm it's up:

```bash
curl http://localhost:8080/api/customers
# → []
```

## 5. Run the frontend

The frontend is plain static HTML/CSS/JS — no npm install needed.

**Option A — VS Code Live Server (recommended)**

1. Open the `frontend` folder in VS Code.
2. Install the **Live Server** extension if you don't have it.
3. Right-click `index.html` → **Open with Live Server**.
4. It opens at something like `http://127.0.0.1:5500`.

**Option B — just open the file**

Double-click `frontend/index.html` to open it directly in your browser.
(Live Server is nicer because it auto-refreshes, but a direct file open works
fine too since the frontend only talks to the backend over `http://localhost:8080`.)

The sidebar shows an **API Connected / API Offline** indicator so you can
confirm the frontend can reach the backend.

## 6. Using the app

1. **Customers** tab → register a customer (name + email required).
2. **Accounts** tab → pick that customer, choose Savings or Current, optionally
   set an initial deposit, and open the account. An account number like
   `AC0000000001` is generated automatically.
3. **Transactions** tab → deposit, withdraw, or transfer by account number.
4. **Statement** tab → pick an account to see its full transaction history.
5. **Dashboard** tab → live totals and the most recent activity.

## 7. REST API reference

| Method | Endpoint                              | Description                       |
|--------|----------------------------------------|------------------------------------|
| GET    | `/api/customers`                       | List customers                    |
| GET    | `/api/customers/{id}`                  | Get one customer                  |
| POST   | `/api/customers`                       | Create customer                   |
| PUT    | `/api/customers/{id}`                  | Update customer                   |
| DELETE | `/api/customers/{id}`                  | Delete customer                   |
| GET    | `/api/accounts`                        | List accounts                     |
| GET    | `/api/accounts/{id}`                   | Get account by id                 |
| GET    | `/api/accounts/number/{accountNumber}` | Get account by account number     |
| GET    | `/api/accounts/customer/{customerId}`  | List accounts for a customer      |
| POST   | `/api/accounts`                        | Open account `{customerId, accountType, initialDeposit}` |
| DELETE | `/api/accounts/{id}`                   | Close account                     |
| GET    | `/api/transactions`                    | List all transactions             |
| GET    | `/api/transactions/account/{accountId}`| List transactions for an account  |
| POST   | `/api/transactions/deposit`            | `{accountNumber, amount, description}` |
| POST   | `/api/transactions/withdraw`           | `{accountNumber, amount, description}` |
| POST   | `/api/transactions/transfer`           | `{fromAccountNumber, toAccountNumber, amount, description}` |

## 8. Troubleshooting

- **"API Offline" in the sidebar** → the backend isn't running, or it's on a
  different port. Check the terminal running `mvn spring-boot:run` for errors.
- **`Access denied for user 'root'@'localhost'`** → fix the username/password
  in `application.properties`.
- **`Unknown database`** → shouldn't happen since `createDatabaseIfNotExist=true`
  is set, but if your MySQL user lacks CREATE privileges, run
  `CREATE DATABASE bank_management_db;` manually in MySQL Workbench or the
  `mysql` CLI.
- **Port 8080 already in use** → change `server.port` in `application.properties`
  and update `API_BASE` at the top of `frontend/js/app.js` to match.
- **CORS errors in the browser console** → make sure you're hitting the
  backend on `http://localhost:8080` — `CorsConfig.java` already allows all
  origins for `/api/**`, so this normally isn't an issue.
