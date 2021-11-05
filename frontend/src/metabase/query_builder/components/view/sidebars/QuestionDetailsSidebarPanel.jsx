import React from "react";
import PropTypes from "prop-types";

import QuestionActionButtons from "metabase/query_builder/components/QuestionActionButtons";
import { ClampedDescription } from "metabase/query_builder/components/ClampedDescription";
import QuestionActivityTimeline from "metabase/query_builder/components/QuestionActivityTimeline";

import { PLUGIN_MODERATION } from "metabase/plugins";

import {
  Container,
  BorderedSectionContainer,
  SidebarPaddedContent,
} from "./QuestionDetailsSidebarPanel.styled";
import DatasetManagementSection from "./DatasetManagementSection";

QuestionDetailsSidebarPanel.propTypes = {
  question: PropTypes.object.isRequired,
  onOpenModal: PropTypes.func.isRequired,
};

function QuestionDetailsSidebarPanel({ question, onOpenModal }) {
  const isDataset = question.isDataset();
  const canWrite = question.canWrite();
  const description = question.description();

  const onDescriptionEdit = canWrite
    ? () => {
        onOpenModal("edit");
      }
    : undefined;

  const hasSections = isDataset || PLUGIN_MODERATION.hasPlugin();

  return (
    <Container>
      <SidebarPaddedContent>
        <QuestionActionButtons
          canWrite={canWrite}
          isDataset={question.isDataset()}
          onOpenModal={onOpenModal}
        />
        <ClampedDescription
          visibleLines={8}
          description={description}
          onEdit={onDescriptionEdit}
        />
        {hasSections && (
          <BorderedSectionContainer>
            {isDataset && canWrite && (
              <DatasetManagementSection dataset={question} />
            )}
            {!isDataset && (
              <PLUGIN_MODERATION.QuestionModerationSection
                question={question}
              />
            )}
          </BorderedSectionContainer>
        )}
      </SidebarPaddedContent>
      <QuestionActivityTimeline question={question} />
    </Container>
  );
}

export default QuestionDetailsSidebarPanel;
