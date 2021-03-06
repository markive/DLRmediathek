var Moment = require('vendor/moment');
module.exports = function(foo) {
	var bar = '';
	switch( Moment(foo).format('YYYYMMDD')) {
	case Moment().format('YYYYMMDD'):
		bar += 'Heute';
		break;
	case Moment().add(-1,'days').format('YYYYMMDD'):
		bar += 'Gestern';
		break;
	case Moment().add(-2,'days').format('YYYYMMDD'):
		bar += 'Vorgestern';
		break;
	case Moment().add(-3,'days').format('YYYYMMDD'):
		bar += 'Übervorgestern';
		break;	
	default:
		bar += Moment(foo).format('DD. MM. YYYY');
	}

	return bar + '  ' + Moment(foo).format('HH:mm') + ' Uhr';
}; 