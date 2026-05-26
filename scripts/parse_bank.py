import csv
import sys
from collections import defaultdict
from decimal import Decimal

INVESTMENT_IBANS = {
    "NL16TRBK4296071611": "Trade Republic",
    "NL80BUNQ2141986478": "Bunq Savings",
    "NL33ABNA0577685503": "Degiro",
    "DE75202208000000019190": "Coinbase",
}

BUNQ_TOPUP_IBAN = "NL04ADYB2017400157"

SALARY_KEYWORDS = ["salaris", "salary"]

def parse_amount(s):
    return Decimal(s.replace(".", "").replace(",", ".").replace("+", ""))

def main(filepath):
    monthly = defaultdict(lambda: {
        "salary": Decimal(0),
        "expenses": Decimal(0),
        "investments": defaultdict(lambda: Decimal(0)),
        "bunq_topups": Decimal(0),
        "other_income": Decimal(0),
        "balance_end": None,
        "tx_count": 0,
    })

    with open(filepath, encoding="latin-1") as f:
        reader = csv.DictReader(f)
        for row in reader:
            date = row["Datum"]
            year, month, _ = date.split("-")
            key = f"{year}-{month}"
            amount = parse_amount(row["Bedrag"])
            counter_iban = row["Tegenrekening IBAN/BBAN"].strip()
            name = row["Naam tegenpartij"].strip()
            desc1 = row.get("Omschrijving-1", "").strip().lower()
            desc2 = row.get("Omschrijving-2", "").strip().lower()
            full_desc = f"{desc1} {desc2}"

            m = monthly[key]
            m["tx_count"] += 1
            m["balance_end"] = row["Saldo na trn"]

            # Salary detection
            if amount > 0 and any(kw in full_desc for kw in SALARY_KEYWORDS):
                m["salary"] += amount
                continue

            # Investment transfers (outgoing)
            if amount < 0 and counter_iban in INVESTMENT_IBANS:
                m["investments"][INVESTMENT_IBANS[counter_iban]] += abs(amount)
                continue

            # Bunq top-ups (can't distinguish savings vs spending from Rabo CSV)
            if amount < 0 and counter_iban == BUNQ_TOPUP_IBAN:
                m["bunq_topups"] += abs(amount)
                continue

            # Other income (not salary)
            if amount > 0:
                m["other_income"] += amount
                continue

            # Regular expense
            if amount < 0:
                m["expenses"] += abs(amount)

    print("=" * 100)
    print(f"{'Month':<10} {'Salary':>10} {'Expenses':>10} {'Net':>10} {'TR':>10} {'Degiro':>10} {'Coinbase':>10} {'BunqSav':>10} {'BunqTop':>10} {'OtherIn':>10} {'Balance':>12}")
    print("=" * 100)

    yearly = defaultdict(lambda: {"salary": Decimal(0), "expenses": Decimal(0), "investments": Decimal(0)})

    for key in sorted(monthly.keys()):
        m = monthly[key]
        net = m["salary"] - m["expenses"] + m["other_income"]
        inv_total = sum(m["investments"].values())
        y = key[:4]
        yearly[y]["salary"] += m["salary"]
        yearly[y]["expenses"] += m["expenses"]
        yearly[y]["investments"] += inv_total + m["bunq_topups"]

        print(f"{key:<10} {m['salary']:>10.2f} {m['expenses']:>10.2f} {net:>10.2f} "
              f"{m['investments'].get('Trade Republic', 0):>10.2f} "
              f"{m['investments'].get('Degiro', 0):>10.2f} "
              f"{m['investments'].get('Coinbase', 0):>10.2f} "
              f"{m['investments'].get('Bunq Savings', 0):>10.2f} "
              f"{m['bunq_topups']:>10.2f} "
              f"{m['other_income']:>10.2f} "
              f"{m['balance_end']:>12}")

    print("\n" + "=" * 80)
    print("YEARLY SUMMARY")
    print("=" * 80)
    for y in sorted(yearly.keys()):
        yy = yearly[y]
        print(f"{y}  Salary: {yy['salary']:>10.2f}  Expenses: {yy['expenses']:>10.2f}  Investments: {yy['investments']:>10.2f}  Net: {yy['salary'] - yy['expenses']:>10.2f}")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\kiril\Downloads\CSV_A_NL43RABO0313440328_EUR_20210501_20260525.csv")
