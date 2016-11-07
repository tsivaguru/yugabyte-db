// Copyright (c) YugaByte, Inc.

import UniverseForm from '../../components/forms/UniverseForm';
import { reduxForm, formValueSelector } from 'redux-form';
import { connect } from 'react-redux';
import { getInstanceTypeList, getInstanceTypeListSuccess, getInstanceTypeListFailure,
         getRegionList, getRegionListSuccess, getRegionListFailure
       } from '../../actions/cloud';
import { createUniverse, createUniverseSuccess, createUniverseFailure,
  editUniverse, editUniverseSuccess, editUniverseFailure,
  fetchUniverseList, fetchUniverseListSuccess, fetchUniverseListFailure, closeDialog, configureUniverseTemplate,
  configureUniverseTemplateSuccess, configureUniverseTemplateFailure, configureUniverseResources,
  configureUniverseResourcesFailure, configureUniverseResourcesSuccess }
  from '../../actions/universe';
import {isValidObject} from '../../utils/ObjectUtils';

//For any field errors upon submission (i.e. not instant check)

const mapDispatchToProps = (dispatch) => {
  return {

    submitConfigureUniverse: (values) => {
      dispatch(configureUniverseTemplate(values)).then((response) => {
          if (response.payload.status !== 200) {
            dispatch(configureUniverseTemplateFailure(response.payload));
          } else {
            dispatch(configureUniverseTemplateSuccess(response.payload));
            dispatch(configureUniverseResources(response.payload.data)).then((resourceData) => {
              if (response.payload.status !== 200) {
                dispatch(configureUniverseResourcesFailure(resourceData.payload));
              } else {
                dispatch(configureUniverseResourcesSuccess(resourceData.payload));
              }
            }); 

          }
        });
    },
    
    submitCreateUniverse: (values) => {
      return new Promise((resolve, reject) => {
        dispatch(createUniverse(values)).then((response) => {
          if (response.payload.status !== 200) {
            dispatch(createUniverseFailure(response.payload));
          } else {
            dispatch(createUniverseSuccess(response.payload));
            dispatch(fetchUniverseList())
              .then((response) => {
                if (response.payload.status !== 200) {
                  dispatch(fetchUniverseListFailure(response.payload));
                  //Add Error message state to modal
                } else {
                  dispatch(fetchUniverseListSuccess(response.payload));
                  dispatch(closeDialog());
                }
              });
          }
        });
      })
    },

    submitEditUniverse: (values, universeUUID) => {
      dispatch(editUniverse(values, universeUUID)).then((response) => {
        if (response.payload.status !== 200) {
          dispatch(editUniverseFailure(response.payload));
        } else {
          dispatch(editUniverseSuccess(response.payload));
          dispatch(fetchUniverseList())
            .then((response) => {
              if (response.payload.status !== 200) {
                dispatch(fetchUniverseListFailure(response.payload));
                //Add Error message state to modal
              } else {
                dispatch(fetchUniverseListSuccess(response.payload));
                dispatch(closeDialog());
              }
            });
        }
      })
    },

    getInstanceTypeListItems: (provider) => {
      dispatch(getInstanceTypeList(provider))
        .then((response) => {
          if(response.payload.status !== 200) {
            dispatch(getInstanceTypeListFailure(response.payload));
          } else {
            dispatch(getInstanceTypeListSuccess(response.payload));
          }
        });
    },
    
    getRegionListItems: (provider, isMultiAZ) => {
      dispatch(getRegionList(provider, isMultiAZ))
        .then((response) => {
          if(response.payload.status !== 200) {
            dispatch(getRegionListFailure(response.payload));
          } else {
            dispatch(getRegionListSuccess(response.payload));
          }
        });
    }    
  }
}

const formFieldNames = ['formType', 'universeName', 'provider',  'providerType', 'regionList',
  'numNodes', 'isMultiAZ', 'instanceType', 'ybServerPackage'];

function mapStateToProps(state, ownProps) {
  const {universe: {currentUniverse}} = state;
  var data = {
    "ybServerPackage": "yb-server-0.0.1-SNAPSHOT.66a01f21a89450af4bfa4bf159811fd2191b83d0.tar.gz",
    "numNodes": 3, "isMultiAZ": true, "instanceType": "m3.medium"
  };

  if (isValidObject(currentUniverse)) {
    data.universeName = currentUniverse.name;
    data.provider = currentUniverse.provider.uuid;
    data.numNodes = currentUniverse.universeDetails.userIntent.numNodes;
    data.isMultiAZ = currentUniverse.universeDetails.userIntent.isMultiAZ;
    data.instanceType = currentUniverse.universeDetails.userIntent.instanceType;
    data.ybServerPackage = currentUniverse.universeDetails.userIntent.ybServerPackage;
    if (isValidObject(currentUniverse.universeDetails)  && currentUniverse.universeDetails.userIntent.isMultiAZ) {
      data.regionList = currentUniverse.regions.map(function (item, idx) {
        return {'value': item.uuid, 'name': item.name, "label": item.name};
      })
    } else {
      data.regionList = {'value': currentUniverse.regions[0].uuid,
                         'name': currentUniverse.regions[0].name,
                         "label": currentUniverse.regions[0].name};
    }
  }

  const selector = formValueSelector('UniverseForm');

  return {
    universe: state.universe,
    cloud: state.cloud,
    initialValues: data,
    formValues: selector(state, 'formType', 'universeName', 'provider', 'providerType', 'regionList',
                         'numNodes', 'isMultiAZ', 'instanceType', 'ybServerPackage')
  };
}


var universeForm = reduxForm({
  form: 'UniverseForm',
  fields: formFieldNames
})




module.exports = connect(mapStateToProps, mapDispatchToProps)(universeForm(UniverseForm));