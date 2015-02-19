var Model = require('model/stations'),
    RSS = new (require('controls/rss.adapter'))(),
    Moment = require('vendor/moment');

module.exports = function(station) {
    if (!station)
        return;
    var items = [];
    function updateListFunc(_RSSitems) {
        var length = _RSSitems.items.length;
        var laststart = Moment().startOf('day');
        var ndx = 0;
        for ( i = 0; i < length; i++) {
            var item = _RSSitems.items[i];
            if (i == 1) {
                _RSSitems.items[0].duration = Moment(item.pubDate).diff(Moment().startOf('day'), 'seconds');
                _RSSitems.items[1].duration = Moment(item.pubDate).diff(laststart, 'seconds');
                _RSSitems.items[0].endtime = Moment(item.pubDate);
                _RSSitems.items[1].endtime = Moment(_RSSitems.items[2].pubDate);
            } else if (i == length - 1) {
                _RSSitems.items[i].duration = Moment().startOf('day').add(1, 'day').diff(Moment(item.pubDate), 'seconds');
                _RSSitems.items[i].endtime = Moment().startOf('day').add(1, 'day');
            } else {
                _RSSitems.items[i].duration = Moment(item.pubDate).diff(laststart, 'seconds');
                _RSSitems.items[i].endtime = Moment(_RSSitems.items[i + 1].pubDate);
            }
            laststart = Moment(item.pubDate);
            item.isonair = (Moment().isBetween(item.pubDate, item.endtime)) ? true : false;
            item.ispast = (Moment().isBefore(item.endtime)) ? false : true;
            if (!item.endtime.isAfter(Moment()))
                ndx++;
        }
        items = [];
        _RSSitems.items.forEach(function(item) {
            var duration = Moment(item.pubDate).diff(laststart, 'seconds');
            var endtime = Moment(item.pubDate).add(duration, 'seconds');
            if ( typeof item.link != 'string')
                item.link = null;
            if (item.ispast)
                return;
                
            items.push({
                properties : {
                    accessoryType : (item.link) ? Ti.UI.LIST_ACCESSORY_TYPE_DISCLOSURE : Ti.UI.LIST_ACCESSORY_TYPE_NONE,
                    itemId : (item.link) ? JSON.stringify(item) : undefined,
                },
               
                onair : {
                    visible : (item.isonair) ? true : false,
                    height : (item.isonair) ? 40 : 5,
                },
                start : {
                    text : Moment(item.pubDate).format('HH:mm'),
                    color : (item.endtime.isAfter(Moment())) ? '#333' : '#bbb'
                },
                description : {
                    html : ( typeof item.description == 'string') ? item.description : '',
                    height : ( typeof item.description == 'string') ? Ti.UI.SIZE : 0,
                    opacity : (item.endtime.isAfter(Moment())) ? 1 : 0.7
                },
                title : {
                    text : item.title,
                    color : Model[station].color,
                    opacity : (item.endtime.isAfter(Moment())) ? 1 : 0.7
                }
            });

        });
        self.sections[0].setItems(items);
        //  self.list.scrollToItem(0, ndx);
    }

   

    var self = Ti.UI.createListView({
        height : Ti.UI.FILL,
        station: station,
        backgroundColor : Model[station].color,
        templates : {
            'schema' : require('TEMPLATES').schema,
        },
        defaultItemTemplate : 'schema',
        sections : [Ti.UI.createListSection({})]
    });
    

    var cron = setInterval(function() {
        RSS.getRSS({
            url : Model[station].rss,
            done : updateListFunc
        });
    }, 30000);
    RSS.getRSS({
        url : Model[station].rss,
        done : updateListFunc
    });
    self.addEventListener('itemclick', function(_e) {
        if (_e.bindId && _e.bindId == 'onair') {
            var item = _e.section.getItemAt(_e.itemIndex);
            _e.section.updateItemAt(_e.itemIndex, item);
        } else {
            var item = JSON.parse(_e.itemId);
            var win = require('ui/generic.window')({
                subtitle : item.title,
                title : 'Deutschlandradio',
                station : station
            });
            var web = Ti.UI.createWebView({
                borderRadius : 1,
                enableZoomControls : false,
                url : item.link
            });
            win.add(web);
            win.open();
        }

    });
    return self;
};

