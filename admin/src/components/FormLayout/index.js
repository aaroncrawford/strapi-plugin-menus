import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { useFormikContext } from 'formik';

import { GenericInput, useLibrary } from '@strapi/helper-plugin';
import { Grid, GridItem } from '@strapi/design-system/Grid';

import { InputUID } from '../';

const FormLayout = ( { fields, gap } ) => {
  const { fields: strapiFields } = useLibrary();
  const { errors, handleChange, values } = useFormikContext();

  return (
    <Grid gap={ gap }>
      { fields.map( ( config, i ) => {
        const { input, grid } = config;

        // If no input to render, we still try to render the grid cell.
        if ( ! input ) {
          return <GridItem key={ i } { ...grid.size } />;
        }

        // Determine default value based on input type.
        let defaultValue = null;

        if ( input.type === 'bool' ) {
          defaultValue = false;
        }

        if ( input.type === 'media' ) {
          defaultValue = [];
        }

        // Cannot use the default value param in the first `get` because we
        // actually want to use the `defaultValue` if we get `null`.
        const fieldValue = get( values, input.name ) ?? defaultValue;
        const fieldErrors = get( errors, input.name, null );

        return (
          <GridItem key={ input.name } { ...grid.size }>
            <GenericInput
              { ...input }
              value={ fieldValue }
              error={ fieldErrors }
              onChange={ handleChange }
              customInputs={ {
                ...strapiFields,
                uid: InputUID,
              } }
            />
          </GridItem>
        );
      } ) }
    </Grid>
  );
};

FormLayout.defaultProps = {
  gap: 6,
};

FormLayout.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape( {
      input: PropTypes.object,
      grid: PropTypes.object.isRequired
    } )
  ).isRequired,
  gap: PropTypes.number,
};

export default FormLayout;
