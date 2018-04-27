/**
 * Functions for control of tables, including filtering, sorting, and modes.
 */
( function (w, d, $) {

  var Row = function(tr) {
    var _data   = {};
    var _header = [];
    var _text   = [];

    function getText(idx) {
      if ( !_text.length ) {
        $( tr ).find( 'td' ).each( function () {
          _text.push( this.textContent || this.innerText || $(this).text() || "" );
        } );
      }

      return (typeof idx === undefined) ? _text : _text[idx];
    }

    function getHeader() {
      if ( !_header.length ) {
        $( tr ).parent( 'tbody' ).prev( 'thead' ).find('th > td').each(function() {
          _header.push( this.textContent || this.innerText || $(this).text() || "" );
        });
      }

      return _header;
    }

    function getData( key ) {
      if ( !_data.length ) {
        _data = ( typeof tr.dataset === 'object' ) ? tr.dataset : dataset( tr );

        var text = getText();
        var head = getHeader();

        for(var x = 0; x < text.length; x++) {
          var tKey = makeProperty(head[x]);
          if(!_data.hasOwnProperty(tKey) {
            _data[tKey] = text[x];
          }
        }
      }

      if ( key && !_data.hasOwnProperty( key ) ) {
        throw new Error( 'The column or data "' + key + '" does not exist in this table.' );
      }

      return (key) ? _data[key] : _data;
    }

    function has(q) {
      var has  = false;
      var data = getData(key);
      var qq = q.toLowerCase();
      Object.keys(data).forEach(function(trait) {
        if(data[trait] && data[trait].toLowerCase().indexOf(qq) >= 0) {
          has = true;
          return;
        }
      }

      return has;
    }

    return { get: getData, has: has, column: getText };
  };

  function makeProperty(key) {
    var parts = key.split(/(-|\s)/);
    var k = '';
    for(var y = 0; y < parts.length; y++) {
      k = k + parts[y][0].toUpperCase() + parts[y].substring(1)
    }

    return k[0].toLowerCase() + k.substring(1);
  }

  $.betterTable = function(el, options) {

    var bt      = this;
    var $table  = $( el );
    bt.settings = $.extend( {}, defaults, options );
    bt._rows    = {};

    function init() {
      // Populate Table
      $table.find( 'tbody > tr' ).each( function () {
        var ident = $( this ).attr( 'data-ident' );
        if ( ident ) {
          bt[ makeProperty( ident ) ] = new Row( this );
        } else {
          bt._rows.push( new Row( this ) );
        }
      } );

      // Set up filter event
      if(bt.settings.search) {
        $(bt.settings.search).searchField({
          search: bt.filter,
          clear:  bt.clear
        });
      }
    }

    bt.clear = function(q) {
      $table.find('tbody').removeClass('in');
      setTimeout(function() {
        $table.find('tr').removeClass(bt.settings.match);
        $table.removeClass(bt.settings.match);
        setTimeout(function() {
          $table.addClass('in');
        }, bt.settings.transition);
      }, bt.settings.transition);
    }

    bt.filter = function(q) {
      $table.removeClass('in').addClass(bt.settings.filtered);
      setTimeout(function() {
        $.each(bt._rows, function() {
          if(this.has(q)) { this.addClass(bt.settings.match); }
        });
        setTimeout(function() {
          $table.addClass('in');
        },bt.settings.transition)
      }, bt.settings.transition);
    }

    init();
  };

  /**
   * @param   {object|string} options Options for plugin, or (if string) name of a function to run.
   * @returns {jQuery}
   */
  $.fn.betterTable = function(options) {
    if(typeof options === 'string') {
      var args   = Array.prototype.slice.call( arguments, 1 );
      var retVal = null;

      this.each(function() {
        var plugin = $.data( this, 'better.table' );
        if ( plugin && typeof plugin[ options ] === 'function' ) {
          retVal = plugin[ options ].apply( this, args );
        } else {
          throw new Error('Method ' +  options + ' does not exist in jQuery.betterTable');
        }
      });

      return (retVal !== undefined) ? retVal : this;
    } else {
      return this.each(function() {
        if (undefined === $(this).data('better.table')) {
          var plugin = new $.betterTable(this, (typeof options === 'object') ? options : {});
          $(this).data('better.table', plugin);
        }
      });
    }
  }

})(window, document, jQuery);