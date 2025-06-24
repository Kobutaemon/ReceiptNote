import CardList from "../components/CardList";

function Dashboard() {
  return (
    <div>
      <header>
        <h1 className="text-3xl text-center pt-4 font-bold">ReceiptNote</h1>
      </header>
      <main>
        <CardList />
      </main>
      <footer>
        <p className="text-center fixed bottom-4 right-[50%] translate-x-[50%]">
          &copy; 2025 Kobutaemon All Right Reserved.
        </p>
      </footer>
    </div>
  );
}

export default Dashboard;
