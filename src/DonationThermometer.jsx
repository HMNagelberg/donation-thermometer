import { useEffect, useState } from "react";

const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRvwDVAwZcxpGpU9SwIfmJS19N1z_XMx8Txw0PIKFRYbbX9Vaffdm6GKyEhXwpSHUPNObHVaScBKilf/pub?gid=0&single=true&output=csv";
const goalAmount = 1000000; // Change your goal here

export default function DonationThermometer() {
  const [currentAmount, setCurrentAmount] = useState(0);

  useEffect(() => {
    const fetchDonationAmount = () => {
      fetch(sheetURL)
        .then(response => response.text())
        .then(csvData => {
          const rows = csvData.split("\n").slice(1); // skip headers
          let total = 0;

          rows.forEach(row => {
            const columns = row.split(",");
            const amount = parseFloat(columns[1]); // assuming amount is 2nd column
            if (!isNaN(amount)) {
              total += amount;
            }
          });

          setCurrentAmount(total);
        })
        .catch(error => {
          console.error('Error fetching Google Sheet:', error);
        });
    };

    fetchDonationAmount();
    const interval = setInterval(fetchDonationAmount, 5000); // Refresh every 5s

    return () => clearInterval(interval);
  }, []);

  const percentage = Math.min((currentAmount / goalAmount) * 100, 100);

  return (
    <div style={{ width: "200px", height: "500px", border: "2px solid #ccc", position: "relative", margin: "0 auto" }}>
      <div
        id="thermometer-fill"
        style={{
          backgroundColor: "red",
          width: "100%",
          height: `${percentage}%`,
          position: "absolute",
          bottom: "0",
          transition: "height 0.5s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: "bold",
          fontSize: "18px"
        }}
      >
        ${currentAmount.toLocaleString()}
      </div>
    </div>
  );
}
