import styled from "@emotion/styled";
import EntityMenu from "metabase/components/EntityMenu";
import { breakpointMaxMedium } from "metabase/styled-components/theme";

export const Root = styled.div`
  width: 100%;
  height: 100%;
`;

export const ActionsHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

export const ActionMenu = styled(EntityMenu)`
  margin-left: 0.5rem;
`;

export const ActionList = styled.ul`
  width: 70%;
  margin-top: 1rem;

  li:not(:first-of-type) {
    margin-top: 1rem;
  }

  ${breakpointMaxMedium} {
    width: 100%;
  }
`;
