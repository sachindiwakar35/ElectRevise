import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Home } from './NewCollection/Home';
import { Select } from './NewCollection/Select';
import { Insert } from "./NewCollection/Insert";
import { BoothSelection } from "./NewCollection/BoothSelection";
import { CompleteList } from "./NewCollection/CompleteList";
import { Sir2025 } from "./NewCollection/Sir2025";
import { DashBooth } from "./NewCollection/DashBooth";
import { Register } from "./NewCollection/Register";
import { User } from "./NewCollection/User";
import { UserVhidhan } from "./NewCollection/UserVhidhan";
import { Upload } from "./NewCollection/Upload";
import { View } from "./NewCollection/View";
import { AdminLogin } from "./NewCollection/AdminLogin";
import { Layout } from "./NewCollection/Layout";
import { VoterDown } from "./NewCollection/VoterDown";
import VoterMerge from "./NewCollection/VoterMerge";
import ZillaUpload from "./NewCollection/ZillaUpload";
import CreateVidhanTable from "./NewCollection/CreateVidhanTable";
import Complete_List from "./NewCollection/Complete_List";
import CreateJillaLogin from "./NewCollection/CreateJillaLogin";
import JillaLogin from "./NewCollection/JillaLogin";
import { JillaView } from "./NewCollection/JillaView";
import { StationSIR } from "./NewCollection/StationSIR";
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<Home />} />
        {/* Routes without Layout */}
        <Route path='/BoothSelection' element={<BoothSelection />} />
        <Route path='/CompleteList' element={<CompleteList />} />
        <Route path='/Complete_List' element={<Complete_List />} />
        <Route path='/Sir2025' element={<Sir2025 />} />
        <Route path='/StationSIR' element={<StationSIR />} />
        <Route path='/DashBooth' element={<DashBooth />} />
        <Route path='/Select' element={<Select />} />
        <Route path='/Admin' element={<User />} />
        {/* Routes under Layout (nav visible only here) */}
        <Route path='/JillaLogin' element={<JillaLogin />} />
        <Route path='/JillaView' element={<JillaView />} />
        <Route element={<Layout />}>
          <Route path='/AdminLogin' element={<AdminLogin />} />
          <Route path='/AdminHome' element={<Insert />} />
          <Route path='/Upload' element={<Upload />} />
          <Route path='/VoterMerge' element={<VoterMerge />} />
          <Route path='/View' element={<View />} />
          <Route path='/Register' element={<Register />} />
          <Route path='/UserVhidhan' element={<UserVhidhan />} />
          <Route path='/VoterDown' element={<VoterDown />} />
          <Route path='/ZillaUpload' element={<ZillaUpload />} />
          <Route path='/CreateVidhanTable' element={<CreateVidhanTable />} />
          <Route path='/CreateJillaLogin' element={<CreateJillaLogin />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
