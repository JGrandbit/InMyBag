let db;
let budgetVersion;

const request = indexedDB.open("BudgetDB", budgetVersion || 21);

request.onupgradeneeded = function (event) {
  console.log("DB update needed");

  const { oldVersion } = event;
  const newVersion = event.newVersion || db.version;

  console.log(
    `DB has been updated from version ${oldVersion} to ${newVersion}`
  );

  db = event.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore("BudgetStore", { autoIncrement: true });
  }
};

request.onerror = function (event) {
  console.log(`There seems to be an error ${event.target.errorCode}`);
};

function checkDatabase() {
  console.log("checking DB");

  let transaction = db.transaction(["BudgetStore"], "readwrite");

  const store = transaction.objectStore("BudgetStore");
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.length !== 0) {
            transaction = db.transaction(["BudgetStore"], "readwrite");
            currentStore = transaction.objectStore("BudgetStore");

            currentStore.clear();
            console.log("All clear!");
          }
        });
    }
  };
}

request.onsuccess = function (event) {
  console.log("success!");
  db = event.target.result;
  if (navigator.onLine) {
    console.log("We're back online now!");
    checkDatabase();
  }
};

const saveRecord = (record) => {
  console.log("Saving record");
  let transaction = db.transaction(["BudgetStore"], "readwrite");
  const store = transaction.objectStore("BudgetStore");

  store.add(record);
};

window.addEventListener("online", checkDatabase);
