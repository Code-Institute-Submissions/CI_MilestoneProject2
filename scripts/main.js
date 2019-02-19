// global variables:

const localisation = "gb";

var jobQuery = "";
var placeQuery = "";

var from = 0;
var to = 6;
var response = [];

//API variables
var page = 1;
var results = 12; // => 48
var daysOld = 10;
var map;


//input functions
$('.input').keydown(function (event) {
    if (event.keyCode == 13) {
        jobQuery = $('#input_job').val();
        placeQuery = $('#input_place').val();
        acquireResponse(1);
    }
});

$('#go').click(function (event) {
    jobQuery = $('#input_job').val();
    placeQuery = $('#input_place').val();
    acquireResponse(1);
});


// general functions
function acquireResponse(requestedPage) {

    console.log(`input: ${jobQuery}`);
    $('#job_list').html("");
    //map.entities.clear(); //this work only with pins and do not work with clusters
    map.layers.clear();
    page = requestedPage;
    from = 0;
    to = 6;

    $("#job_list").append('<img class="mx-auto d-block" src="img/ajax-loading.gif" alt="loading..." width="100">');

    getData(jobQuery, placeQuery, function (data) {
        if (data.length > 0) {
            response = data.results;
            console.log(response);
            writeToHTML();
            addPushpins();
        } else {
            $('#job_list').html('<p style="text-align: center; font-size: 3em;">no results found...</p>');
        }

    });
}

function displayMore() {

    $("#btn_more").remove();
    //from += 6;
    if (response.length > to + 6) {
        to += 6;
        writeToHTML();
        //console.log("more...");
    } else {
        to = response.length;
        writeToHTML();
        $("#btn_more").html("Request next " + results + " jobs from the server").attr("onclick", "requestMore()");
        console.log(`all ${results} jobs displayed...`);
    }
}

function requestMore() {
    $("#btn_more").remove();
    $("#job_list").html("");

    page++;

    acquireResponse(page);
    console.log("requested next " + results + " jobs from server");
}

// Write the results to html
function writeToHTML() {
    console.log("writing to HTML... page: " + page + "; results:" + from + "-->" + to);
    var html = '<div class="row ">';

    for (let index = from; index < to; index++) {
        const element = response[index];
        let time = calculateTime(element.created);
        let description = shorten(element.description, 400);
        let company = shorten(element.company.display_name, 20);
        let salary = element.salary_min != element.salary_max ? "&pound; " + element.salary_min + " - &pound; " + element.salary_max : "&pound; " + element.salary_max;

        html += `<div id="${element.id}" class="col-12 col-sm-6 col-lg-4 p-1 shadow">
                <div class="job_box">
                    <h2 class="job_title">${element.title}</h2>
                    <div class="details_container clearfix">
                        <div class="float-left">
                            <div class="job_company details"><i class="fas fa-building" style="color:blue;"></i>&nbsp;${company}</div>
                            <div class="job_location details"><i class="fas fa-map-marked-alt" style="color:red;"></i>&nbsp;${element.location.display_name}</div>
                        </div>
                        <div class="float-right">
                            <div class="details"><i class="fas fa-money-bill-alt" style="color:green;"></i>&nbsp;${salary}</div>
                            <div class="job_date details"><i class="fas fa-business-time" style="color:orange;"></i>&nbsp;${time}</div>

                        </div>
                        
                    </div>
                    <p class="job_description">${description}</p>
                </div>
                <a class="btn btn-success text-center btn_apply p-2" href="${element.redirect_url}" target="_blank">Apply</a>
                </div>`;
    }
    html += `</div> 
            <button id="btn_more" class="btn btn-primary p-2 shadow float-right" type="submit" onclick="displayMore()">MORE!</button>`;

    $('#job_list').html(html);
}

// WriteToHTML() helper classes

function shorten(word, maxLength) {
    var shortened;
    if (typeof word !== "undefined") {
        shortened = word.replace(/\<strong\>/g, "").replace(/\<\/strong\>/g, "");
        shortened = shortened.length > maxLength ? shortened.substring(0, maxLength) + "..." : shortened;
    } else {
        shortened = "Not Specified";
    }
    return shortened;
}

function calculateTime(time) {
    let result = (new Date() - new Date(time)) / (1000 * 60);
    if (result < 60) {
        result = Math.floor(result);
        if (result === 1) result = result + " minute ago";
        else result = result + " minutes ago";
    } else if (result / 60 < 24) {
        result = Math.floor(result / 60);
        if (result === 1) result = result + " hour ago";
        else result = result + " hours ago";
    } else {
        result = Math.floor(result / (60 * 24));
        if (result === 1) result = result + " day ago";
        else result = result + " days ago";
    }
    return result;
}



// ================== API s ===========================

//Call to Adzuna API
function getData(job, place, cb) {

    const appID = '0bbe3156';
    const appKey = '3c663976945b145820dd4a4acd49ef3c';
    const category = 'it-jobs';

    job = encodeURI(job);
    place = encodeURI(place);

    var url = `https://api.adzuna.com/v1/api/jobs/${localisation}/search/${page}?app_id=${appID}&app_key=${appKey}&results_per_page=${results}&distance=30&max_days_old=${daysOld}&category=${category}&sort_by=date&what=${job}&where=${place}`;

    var xhr = new XMLHttpRequest();

    xhr.open("GET", url);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.send();

    xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            cb(JSON.parse(this.responseText));
        } else {
            console.log(this.status);
        }
        $("#job_list img").remove();
    };
}

//BING Maps API:

function GetMap() {
    map = new Microsoft.Maps.Map('#map', {
        credentials: 'Ardk901xHTnQMsqQm8sYUmbI9R6MC2U1crUKj2S4w9GnC2j_UiCkbZqSpuHPUlTb',
        //center: new Microsoft.Maps.Location(50.50632, -10.12714),
        mapTypeId: Microsoft.Maps.MapTypeId.grayscale,
        disableBirdseye: true,
        disableStreetside: true,
        showMapTypeSelector: false,
        zoom: 6,
        minZoom: 3,
        maxZoom: 10
    });

}

function addPushpins() {

    var pins = [];
    response.forEach(function (element) {

        //console.log(element);

        if (typeof element.latitute != 'number' && typeof element.longitude != 'number') {
            console.log("invalid coordinates: " + typeof element.latitude + ", " + typeof element.longitude);

        } else {
            let location = new Microsoft.Maps.Location(element.latitude, element.longitude);
            let pin = new Microsoft.Maps.Pushpin(location, {
                title: element.title.replace(/\<strong\>/g, "").replace(/\<\/strong\>/g, ""),
                //subTitle: '',
                text: 1,
                color: "rgba(65, 168, 213, 0.5)"
            });

            // map.entities.push(pin);
            pins.push(pin);
        }

    });

    Microsoft.Maps.loadModule('Microsoft.Maps.Clustering', function () {
        var clusterLayer = new Microsoft.Maps.ClusterLayer(pins, {
            clusteredPinCallback: createCustomClusteredPin,
            gridSize: 80
        });
        map.layers.insert(clusterLayer);
    });

}


// this code was taken from Microsoft Documents Customizing Clustered Pushpins Example:
function createCustomClusteredPin(cluster) {
    //Define variables for minimum cluster radius, and how wide the outline area of the circle should be.
    var minRadius = 12;
    var outlineWidth = 7;
    //Get the number of pushpins in the cluster
    var clusterSize = cluster.containedPushpins.length;
    //Calculate the radius of the cluster based on the number of pushpins in the cluster, using a logarithmic scale.
    var radius = Math.log(clusterSize) / Math.log(10) * 5 + minRadius;
    //Default cluster color is red.
    var fillColor = 'rgba(255, 40, 40, 0.5)';
    if (clusterSize < 10) {
        //Make the cluster green if there are less than 10 pushpins in it.
        fillColor = 'rgba(20, 180, 20, 0.5)';
    } else if (clusterSize < 20) {
        //Make the cluster yellow if there are 10 to 19 pushpins in it.
        fillColor = 'rgba(255, 210, 40, 0.5)';
    }
    //Create an SVG string of two circles, one on top of the other, with the specified radius and color.
    var svg = ['<svg xmlns="http://www.w3.org/2000/svg" width="', (radius * 2), '" height="', (radius * 2), '">',
        '<circle cx="', radius, '" cy="', radius, '" r="', radius, '" fill="', fillColor, '"/>',
        '<circle cx="', radius, '" cy="', radius, '" r="', radius - outlineWidth, '" fill="', fillColor, '"/>',
        '</svg>'
    ];
    //Customize the clustered pushpin using the generated SVG and anchor on its center.
    cluster.setOptions({
        icon: svg.join(''),
        anchor: new Microsoft.Maps.Point(radius, radius),
        textOffset: new Microsoft.Maps.Point(0, radius - 8) //Subtract 8 to compensate for height of text.
    });
}