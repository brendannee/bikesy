import React from 'react';
import styled from 'styled-components';

import Card from 'components/Card';
import Controls from 'components/Controls';
import Datasets from 'components/Datasets';
import Directions from 'components/Directions';
import MapLegend from 'components/MapLegend';
import Titlebar from 'components/Titlebar';

const StyledSidebar = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 4rem);
  left: 1rem;
  position: fixed;
  top: 3rem;
  width: 20rem;
  z-index: 5;
`;

const SidebarTop = styled.div`
  flex: 1 0 auto;
`;

const SidebarBottom = styled.div`
  flex: 0 0 auto;
`;

const Sidebar = () => (
  <StyledSidebar>
    <SidebarTop>
      <Titlebar />
      <Controls />
      <Datasets />

      <Directions />
    </SidebarTop>

    <SidebarBottom>
      <MapLegend />

      <Card>
        <Card.Content>
          <div className="disclaimer">
            We offer no guarantee regarding roadway conditions or safety of the proposed
            routes. Use your best judgment when choosing a route. Obey all vehicle code
            provisions.
          </div>
          <a className="disclaimer" href="https://bikesy.com/about">
            About Bikesy
          </a>
        </Card.Content>
      </Card>
    </SidebarBottom>
  </StyledSidebar>
);

export default Sidebar;
