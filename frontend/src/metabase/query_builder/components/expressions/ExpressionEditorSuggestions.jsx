import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import { color } from "metabase/lib/colors";

import Icon from "metabase/components/Icon";
import Popover from "metabase/components/Popover";
import { ListItemStyled, UlStyled } from "./ExpressionEditorSuggestions.styled";

import { isObscured } from "metabase/lib/dom";

const SuggestionSpan = ({ suggestion, isHighlighted }) => {
  const className = cx("text-dark text-bold hover-child", {
    "text-white bg-brand": isHighlighted,
  });

  return !isHighlighted && suggestion.range ? (
    <span>
      {suggestion.name.slice(0, suggestion.range[0])}
      <span className={className}>
        {suggestion.name.slice(suggestion.range[0], suggestion.range[1])}
      </span>
      {suggestion.name.slice(suggestion.range[1])}
    </span>
  ) : (
    suggestion.name
  );
};

SuggestionSpan.propTypes = {
  suggestion: PropTypes.object,
  isHighlighted: PropTypes.bool,
};

function iconForType(type) {
  const altColor = color("brand-white");
  switch (type) {
    case "functions":
      return { icon: "sum", color: color("accent3"), altColor };
    case "fields":
      return { icon: "ellipsis", color: color("accent3"), altColor };
    case "segments":
      return { icon: "segment", color: color("accent2"), altColor };
    case "metrics":
      return { icon: "insight", color: color("accent1"), altColor };
    case "aggregations":
      return { icon: "sum", color: color("brand"), altColor };

    default:
      return { icon: "search", color: color("brand"), altColor };
  }
}

export default class ExpressionEditorSuggestions extends React.Component {
  static propTypes = {
    suggestions: PropTypes.array,
    onSuggestionMouseDown: PropTypes.func, // signature is f(index)
    highlightedIndex: PropTypes.number.isRequired,
  };

  componentDidUpdate(prevProps, prevState) {
    if (
      (prevProps && prevProps.highlightedIndex) !== this.props.highlightedIndex
    ) {
      if (this._selectedRow && isObscured(this._selectedRow)) {
        this._selectedRow.scrollIntoView({ block: "nearest" });
      }
    }
  }

  // when a given suggestion is clicked
  onSuggestionMouseDown(event, index) {
    event.preventDefault();
    event.stopPropagation();

    this.props.onSuggestionMouseDown && this.props.onSuggestionMouseDown(index);
  }

  render() {
    const { suggestions, highlightedIndex } = this.props;

    if (!suggestions.length) {
      return null;
    }

    return (
      <Popover
        className="not-rounded border-dark"
        hasArrow={false}
        tetherOptions={{
          attachment: "top left",
          targetAttachment: "bottom left",
        }}
        sizeToFit
      >
        <UlStyled>
          {suggestions.map((suggestion, i) => {
            const isHighlighted = i === highlightedIndex;
            const { icon, color, altColor } = iconForType(suggestion.type);
            const effectiveColor = isHighlighted ? altColor : color;

            return (
              <React.Fragment key={`suggestion-${i}`}>
                <ListItemStyled
                  onMouseDownCapture={e => this.onSuggestionMouseDown(e, i)}
                  isHighlighted={isHighlighted}
                >
                  <Icon
                    name={icon}
                    color={effectiveColor}
                    size="10"
                    className="mr1"
                  />
                  <SuggestionSpan
                    suggestion={suggestion}
                    isHighlighted={isHighlighted}
                  />
                </ListItemStyled>
              </React.Fragment>
            );
          })}
        </UlStyled>
      </Popover>
    );
  }
}
