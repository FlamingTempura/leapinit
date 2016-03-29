

		

		var Post = Model.extend({
				url: function () {
					var url = _.result(this.collection, 'url');
					if (!url || url.indexOf('room') === -1) {
						url = server + 'api/room/' + this.get('room_id') + '/post';
					}
					return url + '/' + (!this.has('id') ? '' : this.get('id'));
				},
				preview: function (size, cell) {
					if (!this.has('id')) {
						return server + 'api/blankcell?size=' + size + '&color=' + blankcolor;
					}
					return _.result(this, 'url') + '/data?preview=true' +
						(size ? '&size=' + size : '') +
						(cell ? '&cell=true' : '');
				}
			}),
			Posts = Collection.extend({
				model: Post,
				initialize: function () {
					Collection.prototype.initialize.apply(this, arguments);
					this.generateHoneycomb();
					this.on('change add remove reset', this.generateHoneycomb, this);
					this.sort();
				},
				generateHoneycomb: function (width) {
					width = $('body > .app').width();
					var posts = _.clone(this.sort().models).slice(0,50),
						cells = [],
						cellWidth = width / 3.2, //50,
						maxCols = 4,
						row = -1,
						col = -1,

						c = 0.435 * cellWidth,
						b = Math.sin(1.05) * c,

						blankcellurl = server + 'api/blankcell?size=' + cellWidth + '&color=' + blankcolor,
						blankcell = 'url(' + blankcellurl + ')',

						even, cell;
					

					while (posts.length > 0 || col >= 0) {
						cell = {
							id: 'r' + row + 'c' + col,
							index: cells.length,
							col: col,
							row: row
						};

						even = (row % 2) === 0;

						cell.visible = even ? 
							(row > -1 && col > -1 && col < maxCols - 1) : 
							(row > -1 && col > -1 && col < maxCols);
						

						cell.x = (even ? 0.916 : 0) * c + col * 1.86 * c;
						cell.y = row * 1.6 * c;

						
						// If cell is on screen
						if (cell.visible && posts.length > 0) {
							cell.post = posts.shift();
							cell.url = cell.post.preview(cellWidth, true);
							cell.bg = 'url(' + cell.url + ')';
						} else {
							cell.url = blankcellurl;
							cell.bg = blankcell;
						}
						
						col++;

						if (even && col === maxCols || 
								!even && col === maxCols + 1) {
							row++;
							col = -1;
							even = (row % 2) === 0;
						}

						cells.push(cell);
					}

					this.honeycomb = {
						cells: cells,
						rowCount: row + 1,
						cellWidth: 2 * b,
						cellHeight: 0.87 * cellWidth
					};
				}

			});
