import styled from 'styled-components';

const Wrapper = styled.div`
  left: 1rem;
  position: fixed;
  top: 0;
  img {
    float: left;
  }
`;

const TitleBar = () => {
  return (
    <Wrapper>
      <h1>
        <img
          src="/images/bikesy-logo.png"
          srcSet="/images/bikesy-logo@2x.png 2x"
          alt="logo"
          className="logo"
        />
      </h1>
    </Wrapper>
  );
};

export default TitleBar;
