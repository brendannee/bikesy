import React from 'react';
import styled from 'styled-components';

const StyledCard = styled.div`
  background: #fff;
  border-radius: 0.8rem;
  box-shadow: 0 0.2rem 0.5rem rgba(55, 55, 55, 0.15);
  margin: 1rem 0;
  overflow: hidden;
`;

const StyledCardContent = styled.div`
  padding: 1rem;
`;

const Card = ({ children }) => <StyledCard>{children}</StyledCard>;

Card.Content = ({ children }) => <StyledCardContent>{children}</StyledCardContent>;

export default Card;
