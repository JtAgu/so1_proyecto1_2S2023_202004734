import NavBar from './componets/navbar';
import Table from './componets/table';
import Linechart from './componets/linechart';
import Piechart from './componets/piechart';

import './App.css';

function App() {
  return (
    <div className="App">
      <header>
        <NavBar/>
      </header>
      <div class="flex items-center justify-center content">
        <Linechart/>
        <Piechart/>
      </div>
    </div>
  );
}

export default App;
