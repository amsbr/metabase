import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { t } from "ttag";
import { color } from "metabase/lib/colors";
import * as Urls from "metabase/lib/urls";
import { SAVED_QUESTIONS_VIRTUAL_DB_ID } from "metabase/lib/saved-questions";
import Database from "metabase/entities/databases";
import EntityItem from "metabase/components/EntityItem";
import Icon from "metabase/components/Icon";
import { Grid, GridItem } from "metabase/components/Grid";
import { ANALYTICS_CONTEXT, ITEM_WIDTHS } from "../../constants";
import BrowseHeader from "../BrowseHeader";
import { TableCard, TableItemLink, TableLink } from "./TableBrowser.styled";

const propTypes = {
  tables: PropTypes.array.isRequired,
  dbId: PropTypes.number,
  schemaName: PropTypes.string,
  xraysEnabled: PropTypes.bool,
  showSchemaInHeader: PropTypes.bool,
  getTableUrl: PropTypes.func,
};

const TableBrowser = ({
  tables,
  dbId,
  schemaName,
  xraysEnabled,
  showSchemaInHeader = true,
  getTableUrl,
}) => {
  return (
    <div>
      <BrowseHeader
        crumbs={[
          { title: t`Our data`, to: "/browse" },
          getDatabaseCrumbs(dbId),
          showSchemaInHeader && { title: schemaName },
        ]}
      />
      <Grid>
        {tables.map(table => (
          <GridItem key={table.id} width={ITEM_WIDTHS}>
            <TableCard hoverable={table.initial_sync}>
              <TableLink
                to={getTableUrl && table.initial_sync ? getTableUrl(table) : ""}
                data-metabase-event={`${ANALYTICS_CONTEXT};Table Click`}
              >
                <TableBrowserItem
                  table={table}
                  dbId={dbId}
                  xraysEnabled={xraysEnabled}
                />
              </TableLink>
            </TableCard>
          </GridItem>
        ))}
      </Grid>
    </div>
  );
};

TableBrowser.propTypes = propTypes;

const itemPropTypes = {
  table: PropTypes.object.isRequired,
  dbId: PropTypes.number,
  xraysEnabled: PropTypes.bool,
};

const TableBrowserItem = ({ table, dbId, xraysEnabled }) => {
  return (
    <EntityItem
      item={table}
      name={table.display_name || table.name}
      iconName="table"
      iconColor={color("accent2")}
      loading={!table.initial_sync}
      disabled={!table.initial_sync}
      buttons={
        table.initial_sync && (
          <TableBrowserItemButtons
            tableId={table.id}
            dbId={dbId}
            xraysEnabled={xraysEnabled}
          />
        )
      }
    />
  );
};

TableBrowserItem.propTypes = itemPropTypes;

const itemButtonsPropTypes = {
  tableId: PropTypes.number,
  dbId: PropTypes.number,
  xraysEnabled: PropTypes.bool,
};

const TableBrowserItemButtons = ({ tableId, dbId, xraysEnabled }) => {
  return (
    <Fragment>
      {xraysEnabled && (
        <TableItemLink
          to={`/auto/dashboard/table/${tableId}`}
          data-metabase-event={`${ANALYTICS_CONTEXT};Table Item;X-ray Click`}
        >
          <Icon
            name="bolt"
            size={20}
            tooltip={t`X-ray this table`}
            color={color("warning")}
          />
        </TableItemLink>
      )}
      <TableItemLink
        to={`/reference/databases/${dbId}/tables/${tableId}`}
        data-metabase-event={`${ANALYTICS_CONTEXT};Table Item;Reference Click`}
      >
        <Icon
          name="reference"
          tooltip={t`Learn about this table`}
          color={color("text-medium")}
        />
      </TableItemLink>
    </Fragment>
  );
};

TableBrowserItemButtons.propTypes = itemButtonsPropTypes;

const getDatabaseCrumbs = dbId => {
  if (dbId === SAVED_QUESTIONS_VIRTUAL_DB_ID) {
    return {
      title: t`Saved Questions`,
      to: Urls.browseDatabase({ id: SAVED_QUESTIONS_VIRTUAL_DB_ID }),
    };
  } else {
    return {
      title: <Database.Link id={dbId} />,
    };
  }
};

export default TableBrowser;
