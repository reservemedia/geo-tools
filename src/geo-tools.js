var https = require('https');

// Calculates the distance between to sets of coordinates
exports.distance = function (lat1, lng1, lat2, lng2) {
    if (lat1.lat && lng1.lat) {
        lat2 = lng1.lat;
        lng2 = lng1.lng;
        lng1 = lat1.lng;
        lat1 = lat1.lat;
    }

    // Confirms the user inputted arguments are in the correct format
    distanceArgumentCheck(lat1, lng1, lat2, lng2);
    var R = 6371, // km
        dLat = toRad(lat2 - lat1),
        dLng = toRad(lng2 - lng1);

    lat1 = toRad(lat1);
    lat2 = toRad(lat2);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2),
        c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return (R * c);
};

// Confirms the parameters are the proper type for distance()
var distanceArgumentCheck = function (lat1, lng1, lat2, lng2) {
    for (var i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] !== 'number' || parseFloat(arguments[i]) === NaN) {
            console.log('Invalid Parameter(s)');
        }
    }
};

// Converts numeric degrees to radians. Used in distance()
var toRad = function (deg) {
    return deg * Math.PI / 180;
};

// Converts a physical address to a set of coordinates
exports.geocode = function (address, callback, options) {

    // Prepares the inputted address into the search query
    var query = address.split(' ').join('+') + '&sensor=false',
        host = 'maps.googleapis.com',
        path;

    // Check for API key
    path = (options)
        ? '/maps/api/geocode/json?address=' + query + '&key=' + options.key
        : '/maps/api/geocode/json?address=' + query;

    options = {
        host: host,
        path: path
    };

    var req = https.get(options, function (res) {
        // console.log('Response: ' + res.statusCode);
        var results = '';

        res.on('error', function (e) {
            console.log('Error: ' + e.message);
        });

        res.on('data', function (data) {
            results += data;
        });

        res.on('end', function () {
            var body = JSON.parse(results);
            if (body.error_message || !body.results || !body.results.length) {
                if (body.error_message) console.log(body.error_message);

                if (callback) {
                    return callback({ error: body.error_message || 'invalid response' });
                } else {
                    return;
                }
            }

            var lat = (body.results[0].geometry.location.lat),
                lng = (body.results[0].geometry.location.lng),
                coordinates = { 'lat': lat, 'lng': lng };

            if (callback) {
                callback(coordinates);
            } else {
                return coordinates;
            }
        });
    });
};

// Converts a set of coordinates to a physical address
exports.reverseGeocode = function (lat, lng, callback) {
    if (lat.lat && lat.lng) {
        callback = lng;
        lng = lat.lng;
        lat = lat.lat;
    }

    // Prepares the inputted lat/lng into the search query
    var query = lat.toString() + ',' + lng.toString() + '&sensor=false',
        options = {
            host: 'maps.googleapis.com',
            path: '/maps/api/geocode/json?latlng=' + query
        };

    var req = https.get(options, function (res) {
        // console.log('Response: ' + res.statusCode);
        var results = '';

        res.on('error', function (e) {
            console.log('Error: ' + e.message);
        });

        res.on('data', function (data) {
            results += data;
        });

        res.on('end', function () {
            var body = JSON.parse(results);
            if (body.error_message) {
                console.log(body.error_message);
                return;
            }

            var address = gMapsFormResponseData(body);

            if (callback) {
                callback(address);
            } else {
                return address;
            }
        });
    });
};

// Maps the returned JSON from Google APIs for the reverseGeocode function
var gMapsFormResponseData = function (json) {
    var address = {
            full_address: json.results[0].formatted_address
        },
        addressJSON = json.results[0].address_components;

    for (var i = 0; i < addressJSON.length; i++) {
        switch (addressJSON[i].types[0]) {
            case 'street_number':
                address.street_number = addressJSON[i].long_name;
                break;
            case 'route':
                address.street = addressJSON[i].long_name;
                break;
            case 'neighborhood':
                address.neighborhood = addressJSON[i].long_name;
                break;
            case 'locality' || 'sublocality':
                address.city = addressJSON[i].long_name;
                break;
            case 'administrative_area_level_2':
                address.county = addressJSON[i].long_name;
                break;
            case 'administrative_area_level_1':
                address.state = addressJSON[i].long_name;
                break;
            case 'country':
                address.country = addressJSON[i].long_name;
                break;
            case 'postal_code':
                address.postal_code = addressJSON[i].long_name;
                break;
        }
    }

    return address;
};

// Converts KM into miles
exports.toMiles = function (distance) {
    return distance * 0.621371;
};

// Converts KM into meters
exports.toMeters = function (distance) {
    return distance * 1000;
};

// Converts KM into yards
exports.toYards = function (distance) {
    return distance * 1093.61;
};

// Converts KM into feet
exports.toFeet = function (distance) {
    return distance * 3280.84;
};