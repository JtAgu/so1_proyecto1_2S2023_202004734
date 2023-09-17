import NavBar from './componets/navbar';
import Table from './componets/table';

import './App.css';

function App() {
  return (
    <div className="App">
      <header>
        <NavBar/>
      </header>
      <div class="flex items-center justify-center content">
        
        <Table/>
      </div>
    </div>
  );
}

export default App;
