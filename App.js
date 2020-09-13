import React, {Component} from 'react';
import {
  PermissionsAndroid,
  StyleSheet,
  Text,
  View,
  ToastAndroid,
  Alert,
} from 'react-native';
import GeoFencing from 'react-native-geo-fencing';
import Geolocation from '@react-native-community/geolocation';
import MapView, {PROVIDER_GOOGLE, Marker, Polygon, AnimatedRegion} from 'react-native-maps';
import gridData from './gridData';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

class App extends Component {
  constructor() {
    super();
    this.state = {
      initialRegion: {
        latitude: 10,
        longitude: 10,
        latitudeDelta: 0.001,
        longitudeDelta: 0.001,
      },
      currLoc: null,
      gridData: [],
      currentGridDetails: '',
    };
  }

  componentDidMount = async () => {
    let access = await this.accessPermission();
    console.log('Access Permission : ' + access);
    console.log('Navigator option : ' + Geolocation);
    let initialPosition = null;
    if (access) {
      await Geolocation.getCurrentPosition(
        (position) => {
          initialPosition = JSON.stringify(position);
          console.log(initialPosition);
        },
        (error) => alert(error.message),
        {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000, distanceFilter:0},
      );
    }
    console.log('Initial Position : ' + initialPosition);
    if (initialPosition !== null) {
      this.setState({
        gridData: gridData(
          initialPosition.coords.latitude,
          initialPosition.coords.longitude,
        ),
      });
      this.setState({
        initialRegion: this.getDeltas(
          initialPosition.coords.latitude,
          initialPosition.coords.longitude,
        ),
      });
    }
    Geolocation.watchPosition((position) => {
      console.log("Watch Position : " + JSON.stringify(position));
      this.setState({currLoc: position});
      this.setState({
        gridData: gridData(position.coords.latitude, position.coords.longitude),
      });
      this.setState({
        initialRegion: this.getDeltas(
          position.coords.latitude,
          position.coords.longitude,
        ),
      });
      this.state.gridData.map((polygon) => {
        let polygonDetail = [];
        polygon.rectCords.map((pot) => {
          let polypot = {
            lat: pot.latitude,
            lng: pot.longitude,
          };
          polygonDetail.push(polypot);
        });

        this.geoLocationHandler(
          position,
          polygonDetail,
          polygon.title,
          polygon.description,
        );
      });
    });
  };

  geoLocationHandler = (point, polygon, title, description) => {
    var pointDetail = {
      lat: point.coords.latitude,
      lng: point.coords.longitude,
    };

    GeoFencing.containsLocation(pointDetail, polygon)
      .then(() => {
        ToastAndroid.show(
          'within area ' + JSON.stringify(polygon),
          ToastAndroid.LONG,
        );
        this.setState({
          currentGridDetails:
            'within area. Grid Name :' +
            title +
            ' Description : ' +
            description,
        });
        return;
      })
      .catch(() => {});
  };

  polygonHandler = (markerDetails) => {
    // Alert.alert(markerDetails);
    // this.setState({ currentGridDetails: markerDetails.description });
  };

  getDeltas = (lat, lng, distance = 5) => {
    const oneDegreeOfLatitudeInMeters = 111.32 * 1000;

    const latitudeDelta = distance / oneDegreeOfLatitudeInMeters;
    const longitudeDelta =
      distance /
      (oneDegreeOfLatitudeInMeters * Math.cos(lat * (Math.PI / 180)));

    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta,
      longitudeDelta,
    };
  };

  accessPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Access to use your location',
          message:
            'location can able to view grid ' +
            'location can able to view grid',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the location');
        return true;
      } else {
        console.log('Location permission denied');
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  onRegionChange = (region) =>{
    console.log("Region Change : " + JSON.stringify(region))
    this.setState({initialRegion: region})
  }
  componentWillUnmount = () => {
    // navigator.geolocation.clearWatch(this.watchID);
  };
  render() {
    return (
      <>
        {Object.keys(this.state.initialRegion).length > 0 ? (
          <>
            <MapView
              region={this.state.initialRegion}
              style={styles.mapView}
              provider={PROVIDER_GOOGLE}
              showsUserLocation={true}
              followsUserLocation={true}
              >
              {this.state.currLoc !== null && (
                <Marker
                  key={'test'}
                  coordinate={{
                    latitude: this.state.currLoc.coords.latitude,
                    longitude: this.state.currLoc.coords.longitude,
                  }}
                  title={'My Location'}
                  description={'Location Test'}
                  draggable={true}
                  >
                    <MaterialIcons name="location-pin" size={50} color="green" />
                  </Marker>
              )}
              {this.state.gridData.length > 0 &&
                this.state.gridData.map((marker) => {
                  return (
                    <>
                      <Polygon
                        key={'grid' + marker.lng}
                        coordinates={marker.rectCords}
                        fillColor="#edfeff"
                        onPress={() => {
                          this.polygonHandler(marker);
                        }}
                        tappable={true}
                      />
                    </>
                  );
                })}
            </MapView>
            {this.state.currLoc !== null && (
              <View>
                <Text>
                  Location: {this.state.currLoc.coords.latitude},{' '}
                  {this.state.currLoc.coords.longitude}
                </Text>
                <Text style={{height: 50}}>
                  Location: {this.state.currentGridDetails}
                </Text>
              </View>
            )}
          </>
        ) : (
          <Text>No Render</Text>
        )}
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapView: {
    height: '85%',
  },
});

export default App;
