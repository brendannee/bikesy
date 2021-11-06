import React from 'react';
import styled from 'styled-components';

import Controls from 'components/Controls';
import Datasets from 'components/Datasets';
import Directions from 'components/Directions';
import MapLegend from 'components/MapLegend';
import Titlebar from 'components/Titlebar';

const StyledSidebar = styled.div`
  left: 1rem;
  position: fixed;
  top: 3rem;
  width: 20rem;
  z-index: 5;
`;

const Sidebar = () => (
  <StyledSidebar>
    <Titlebar />
    <Controls />
    <Datasets />

    <Directions />
    <MapLegend />
  </StyledSidebar>
);

export default Sidebar;
