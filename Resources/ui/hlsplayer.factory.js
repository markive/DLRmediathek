var RecentsModule = require('controls/recents.adapter');

String.prototype.toHHMMSS = function() {
	var sec_num = parseInt(this, 10);
	// don't forget the second param
	var hours = Math.floor(sec_num / 3600);
	var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
	var seconds = sec_num - (hours * 3600) - (minutes * 60);

	if (hours < 10) {
		hours = "0" + hours;
	}
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	if (seconds < 10) {
		seconds = "0" + seconds;
	}
	var time = (hours != '00') ? hours + ':' + minutes + ':' + seconds : minutes + ':' + seconds;
	return time;
};

var AudioPlayer = function(options) {
	this.options = options;
	this._Recents = new RecentsModule({
		url : this.options.url,
		title : this.options.title,
		subtitle : this.options.subtitle,
		duration : this.options.duration,
		author : this.options.author,
		image : '/images/' + this.options.station + '.png',
		station : this.options.station,
		pubdate : this.options.pubdate
	});
	this.progress = this._Recents.getProgress(this.options.url);
	this.createView();
	var that = this;
	setTimeout(function() {
		that._player = Ti.Media.createAudioPlayer({
			allowBackground : true,
			volume : 1
		});
		that._player.addEventListener('progress', function(_e) {
			that._progress.setValue(_e.progress / 1000);
			that._duration.setText(('' + _e.progress / 1000).toHHMMSS() + ' / ' + ('' + that.options.duration).toHHMMSS());
			that._Recents.setProgress({
				progress : _e.progress,
				url : that.options.url
			});
		});
		that._player.addEventListener('complete', function(_e) {
			Ti.API.error(_e.error);
			Ti.API.error('completed code = ' + _e.code);
			that._player.release();
			that._view.setVisible(false);
		});
		that._player.addEventListener('complete', function(_e) {
			that._Recents.setComplete();
		});
		that._player.addEventListener('change', function(_e) {
			Ti.API.error(_e.state + '    ' + _e.description);
			switch (_e.description) {
			case 'initialized':
				that._control.image = '/images/stop.png';
				Ti.Media.vibrate();
				break;
			case 'stopped':
				that._equalizer.opacity = 0;
				that._control.image = '/images/play.png';
				break;
			case 'stopping':
				that._equalizer.opacity = 0;
				if (that._interval)
					clearInterval(that._interval, 1000);
				that._control.image = '/images/play.png';
				that._equalizer.opacity = 0;
				that._player.release();
				that._view.hide();
				break;
			case 'starting':
				that._control.image = '/images/leer.png';
				break;
			case 'paused':
				that._subtitle.ellipsize = false;
				that._equalizer.opacity = 0;
				that._control.image = '/images/play.png';
				break;
			case 'playing':
				if (that.progress > 10) {
					var dialog = Ti.UI.createAlertDialog({
						cancel : 1,
						buttonNames : ['Neustart', 'Weiter'],
						message : 'Das Stück wurde unterbrochen, was soll jetzt geschehen?',
						title : 'Weiter hören'
					});
					dialog.addEventListener('click', function(e) {
						if (e.index != 0) {
							that._player.playing && that._player.setTime(that.progress * 1000);
							that.progress && Ti.UI.createNotification({
								duration : 2000,
								message : 'Setzte Wiedergabe am Zeitpunkt „' + ('' + that.progress).toHHMMSS() + '“ fort.'
							}).show();
							return;
						}
					});
					dialog.show();
				} else {
				}
				that._subtitle.ellipsize = Ti.UI.TEXT_ELLIPSIZE_TRUNCATE_MARQUEE;
				that._spinner.hide();
				that._equalizer.animate({
					opacity : 1,
					duration : 700
				});
				that._control.image = '/images/pause.png';
				break;
			}
		});
		that.startPlayer();
	}, 500);
	return this._view;
};

AudioPlayer.prototype = {
	createView : function(args) {
		this.color = (this.options.color) ? this.options.color : 'black', this._view = Ti.UI.createView({
			visible : false
		});
		this._view.add(Ti.UI.createView({
			opacity : 0.5,
			touchEnabled : false,
			backgroundColor : this.color
		}));
		this._view.add(Ti.UI.createView({
			opacity : 0.5,
			touchEnabled : false,
			backgroundColor : 'black'
		}));
		this._container = Ti.UI.createView({
			bubbleParent : false,
			touchEnabled : false,
			height : 230,
			bottom : -230,
			backgroundColor : 'white'
		});
		this._view.add(this._container);
		this._progress = Ti.UI.createProgressBar({
			bottom : 120,
			left : 80,
			right : 10,
			height : 30,
			width : Ti.UI.FILL,
			min : 0,
			max : 100
		});
		this._duration = Ti.UI.createLabel({
			bottom : 102,
			bubbleParent : false,
			touchEnabled : false,
			font : {
				fontSize : 12
			},
			color : this.color,
			right : 10,
		});
		this._title = Ti.UI.createLabel({
			top : 10,
			bubbleParent : false,
			touchEnabled : false,
			color : this.color,
			ellipsize : true,
			height : 25,
			font : {
				fontSize : 18,
				fontWeight : 'bold',
				fontFamily : 'Aller Bold'
			},
			left : 10,
		});
		this._subtitle = Ti.UI.createLabel({
			top : 36,
			bubbleParent : false,
			touchEnabled : false,
			color : '#555',
			horizontalWrap : false,
			wordWrap : false,
			width : Ti.UI.FILL,
			ellipsize : true,
			height : 20,
			font : {
				fontSize : 14,
				fontFamily : 'Aller Bold'
			},
			left : 10,
			right : 15
		});
		this._control = Ti.UI.createImageView({
			width : 50,
			height : 50,
			bubbleParent : false,
			left : 10,
			image : '/images/play.png',
			bottom : 115
		});
		this._spinner = Ti.UI.createActivityIndicator({
			style : Ti.UI.ActivityIndicatorStyle.BIG,
			bottom : 102,
			left : -3,
			transform : Ti.UI.create2DMatrix({
				scale : 0.8
			}),
			height : Ti.UI.SIZE,
			width : Ti.UI.SIZE
		});
		this._equalizer = Ti.UI.createWebView({
			borderRadius : 1,
			width : 250,
			height : 40,
			bubbleParent : false,
			touchEnabled : false,
			scalesPageToFit : true,
			url : '/images/equalizer.gif',
			bottom : 30,
			left : 80,
			opacity : 0,
			enableZoomControls : false
		});
		this._container.add(this._progress);
		this._container.add(this._duration);
		this._container.add(this._title);
		this._container.add(this._subtitle);
		this._container.add(this._control);
		this._container.add(this._spinner);
		var that = this;
		this._control.addEventListener('click', function() {
			if (that._player.isPlaying()) {
				that._player.pause();
			} else if (that._player.isPaused()) {
				that._player.play();
			}
		});
		this._view.addEventListener('click', function() {
			Ti.API.error('Info: background of player clicked');
			that.stopPlayer();
		});
		return this._view;
	},
	startPlayer : function() {
		if (Ti.Network.online != true) {
			Ti.UI.createNotification({
				message : 'Bitte Internetverbindung prüfen.\nSo geht das auch auch lizenzrechtlichen Gründen leider nicht.'
			}).show();
			this.stopPlayer();
			return;
		}
		Ti.App.fireEvent('app:stop');
		this._view.setVisible(true);
		var that = this;
		this._container.animate({
			bottom : -90
		}, function() {
			that._container.animate({
				bottom : -100,
				duration : 10
			});
		});
		this._spinner.show();
		this._progress.setMax(this.options.duration);
		this._progress.setValue(0);
		this._title.setText(this.options.title);
		this._subtitle.setText(this.options.subtitle);
		this._duration.setText(('' + this.options.duration).toHHMMSS());
		this._view.add(this._equalizer);
		this._player.setUrl(this.options.url + '?_=' + Math.random());
		that._player.start();
	},
	stopPlayer : function() {
		if (this._player.isPlaying() || this._player.isPaused()) {
			Ti.API.error('Info: try 2 stop player - was playing or paused');
			this._player.stop();
			this._player.release();
			Ti.API.error('Info: stopped and released');
		}

		if (this._view.oncomplete && typeof this._view.oncomplete == 'function') {
			console.log('onCompleted called');
			this._view.oncomplete();
		}
	}
};

exports.createAndStartPlayer = function(options) {
	return new AudioPlayer(options);
};
