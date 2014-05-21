$(function() {
	window.paginationListOptions.totalPagesDisplayFormat = "共<%= pageCount %>页, <%= total %>条";
	var $list = $("#list1");
	function generateRandomString(n) {
		var  source = "0123456789qwertyuioplkjhgfdsazxcvbnm";
  		var  result = "";
  		for(var i=0;i<n;i++)  {
  			result += source.charAt(Math.ceil(Math.random()*100000000) % source.length);
  		}
  		return  result;
	}
	function generateArrayOfRandomString(count, len) {
		var result = [];
		for(var i=0;i<count;++i) {
			result.push(generateRandomString(len));
		}
		return result;
	}
	var pageCount = parseInt(Math.random() * 50 + 50);
	var initPaginator = {
		page: 1,
		pageCount: pageCount,
		pageSize: 10,
		paginationDisplayCount: 5,
		total: 10 * pageCount
	};
	function onSelect(view, model, callback) {
		alert('you select ' + model.get('name'));
	}
	$list.paginationList({
		onLoadPage: function(paginator, callback) {
			var items = []
			for(var i=0; i < paginator.get('pageSize'); ++i) {
				// you can use ajax or other method to fetch data
				items.push({
					name: generateRandomString(6)
					, button: {  // button is optional
						text: 'Select'
						, click: onSelect
					}
				});
			}
			initPaginator.page = paginator.get('page');
			var data = {
				items: items,
				paginator: initPaginator
			};
			callback(data);
		},
		onClick: onSelect
	});
});