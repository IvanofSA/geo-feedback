(function() {
    var myMap;

    new Promise(function(resolve) {
        ymaps.ready(resolve);
    }).then(function() {
        return new Promise(function(resolve) {
            myMap = new ymaps.Map("map", {
                center:  [59.93667, 30.31500],
                zoom: 9
            });

            resolve(myMap);

        });
    }).then(function(myMap) {
        return new Promise(function(resolve, reject) {
            var reqGet  = new XMLHttpRequest();
            var reqData = {op: "all"};
            // console.log(reqData);
            reqGet.open('POST', 'http://localhost:3000/');

            reqGet.onload = function(e) {
                var data = JSON.parse(reqGet.response);
                resolve(data);
            };

            reqGet.send(JSON.stringify(reqData));
        });

    }).then(function(data) {
      return new Promise(function(resolve) {
        var markaKeys = Object.keys(data);
        var popup = document.querySelector('.popup');
        var close = document.querySelector('.close');
        var listReview = document.querySelector('.review__list');
        var form = document.querySelector('.form');
        // console.log(markaKeys);
        // console.log(data);
      if (markaKeys.length) {
          var customItemContentLayout = ymaps.templateLayoutFactory.createClass(
            '<h2 class=ballon_header>{{ properties.balloonContentHeader|raw }}</h2>' +
            '<div class=ballon_body><a href="#" class="baloon__link">{{ properties.balloonContentBody|raw }}</a></div>' +
            '<div class=ballon_content>{{ properties.balloonContentContent|raw }}</div>' +
            '<div class=ballon_footer>{{ properties.balloonContentFooter|raw }}</div>'
        );
        var clusterer = new ymaps.Clusterer({
          clusterDisableClickZoom: true,
          clusterOpenBalloonOnClick: true,
          clusterBalloonContentLayout: 'cluster#balloonCarousel',
          clusterBalloonItemContentLayout: customItemContentLayout,
          clusterBalloonPanelMaxMapArea: 0,
          clusterBalloonContentLayoutWidth: 250,
          clusterBalloonContentLayoutHeight: 150,
          clusterBalloonPagerSize: 5
        });

        var geoObjects = [];
        markaKeys.forEach(function(val, index) {

            for(var i = 0; i < data[val].length; i++) {
                var coordArr = [data[val][i].coords.x, data[val][i].coords.y];
                var parseDate = new Date(data[val][i].date);
                var place = data[val][i].place;
                var address = data[val][i].address;
                var text   = data[val][i].text;

                geoObjects.push( getGeoObj( coordArr, place, address, text, parseDate ) );
            }
        });

        function getGeoObj( coordArr, place, address, text, date ) {
          return new ymaps.Placemark(coordArr, {
              balloonContentHeader:  place,
              balloonContentBody: address,
              balloonContentContent: text,
              balloonContentFooter: date.toLocaleString()
            }, {preset: 'islands#Icon'});
        };

        clusterer.add(geoObjects);
        myMap.geoObjects.add(clusterer);
        }

        document.addEventListener('click', showReview);

        function showReview(e) {
          if (e.target.getAttribute('class') === 'baloon__link') {
            new Promise(function(resolve, reject) {
                var link      = e.target;
                var linkText  = link.innerText;
                var req       = {
                    op: "get",
                    address: linkText
                };
                var xhrReview = new XMLHttpRequest();

                xhrReview.open('POST', 'http://localhost:3000/');
                xhrReview.onload = function() {
                    var data = JSON.parse(xhrReview.response);
                    // console.log(data);
                    resolve(data);
                };
                xhrReview.send(JSON.stringify(req));
            }).then(function(data) {
              // var popup = document.querySelector('.popup');
              var reviewList = document.querySelector('.review__list');
              var headerName = document.querySelector('.adress__name');
              var linkKeys = Object.keys(data);

              myMap.balloon.close();
              popup.classList.remove('hide');

              linkKeys.forEach(function(value, ind) {

                var address = data[value].address;
                var parseDate = new Date(data[value].date);
                var place = data[value].place;
                var address = data[value].address;
                var text   = data[value].text;
                var name   = data[value].name;

                var naweDate = parseDate.getFullYear() + '.' +
					                     parseDate.getMonth() + '.' +
					                     parseDate.getDate() + ' ' +
					                     parseDate.getHours() + ':' +
					                     parseDate.getMinutes() + ':' +
					                     parseDate.getSeconds();


                var newLi = document.createElement('li');

                headerName.innerHTML = address;
                newLi.classList.add('review__item');
                newLi.innerHTML = '<span>'+ name +'</span> <span>'+ place +'</span> <span>'+ naweDate +'</span> <p>'+ text +'</p>'
                reviewList.appendChild(newLi);

              });

            });
          } else if(e.target.getAttribute('class') === 'close'){
            listReview.innerHTML = '';
            popup.classList.add('hide');
          }
        }

      myMap.events.add('click', function (e){
				var coords = e.get('coords');
				ymaps.geocode(coords, {
					results: 1
			}).then(function(res){
				var address = null;
				if (res.geoObjects.get(0)) {
          var headerName = document.querySelector('.adress__name');
					var address = res.geoObjects.get(0).properties.get('text');
					headerName.innerHTML = address;
					popup.classList.remove('hide');
          // console.log(coords);
          // currentPosition = {pos: coords, address: address};
          // console.log(currentPosition);
          // console.log(coords);
            showModal(coords);
				}
			});
      });

      close.addEventListener('click', closePopup);
      function closePopup(e){
            // console.log(form.name.value);
          listReview.innerHTML = '';
          popup.classList.add('hide');
      }

        form.addEventListener('submit', sendAjax);
        function sendAjax(e) {
          e.preventDefault();
          var req = new XMLHttpRequest();
          var headerName = document.querySelector('.adress__name');
          var nameValue = form.name.value;
          var placeValue = form.place.value;
          var reviewValue = form.review.value;
          var reviewList = document.querySelector('.review__list');
          var date = new Date();
          var addressText = headerName.innerText;
          var data = {
              'op': 'add',
              'review': {
                  'coords':{
                      'x': coords[0],
                      'y': coords[1]
                  },
                  'address': addressText,
                  'name'   : nameValue,
                  'place'  : placeValue,
                  'text'   : reviewValue,
                  'date'   : date.toUTCString()
              }
          };

          var newLi = document.createElement('li');
          newLi.classList.add('review__item');
          newLi.innerHTML = '<b>'+ nameValue +'</b> <span>'+ placeValue +'</span> <span>'+ date.toUTCString() +'</span> <p>'+ reviewValue +'</p>'
          reviewList.appendChild(newLi);

          req.open('POST', 'http://localhost:3000/');
          console.log(data);

          req.send(JSON.stringify(data));

          req.onload = function() {
            console.log('data was sended.');
          };
          form.name.value = '';
          form.place.value = '';
          form.review.value = '';
        }

    });
    }).catch(function(e) {
      alert('Ошибка: ' + e.message);
    });

}());
