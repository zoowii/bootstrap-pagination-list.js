/**
 * requirements: underscore.js, bootstrap 3.1+, jQuery 1.9+, backbone.js
 */

(function ($) {
    window.paginationListOptions = {
        totalPagesDisplayFormat: 'Total: <%= pageCount %> Pages, <%= total %> Count'
    }; // global settings
    function Paginator(options) {
        _.extend(this, {
            page: 1,
            pageSize: 10,
            total: 0,
            paginationDisplayCount: 5
        }, options);
    }

    Paginator.prototype.getPageCount = function () {
        return 1 + parseInt((this.total - 1) / this.pageSize);
    };
    Paginator.prototype.getStartPage = function () {
        var p = this.page - parseInt(this.paginationDisplayCount / 2);
        if (p < 1) {
            p = 1;
        }
        return p;
    };
    Paginator.prototype.getEndPage = function () {
        var p = this.getStartPage() + this.paginationDisplayCount - 1;
        if (p > this.getPageCount()) {
            p = this.getPageCount();
        }
        return p;
    };
    Paginator.prototype.canPrev = function () {
        return this.getStartPage() > 1;
    };
    Paginator.prototype.canNext = function () {
        return this.getEndPage() < this.getPageCount;
    };
    var emptyFunction = function () {
    };
    var BaseView = Backbone.View.extend({
        render: function () {
            this.$el.html(this.template(this.model instanceof Backbone.Model ? {data: this.model} : this.model));
            if (_.isFunction(this.afterRender)) {
                this.afterRender();
            }
            return this;
        }
    });
    var ListNodeModel = Backbone.Model.extend({
        isDisabled: function () {
            return this.get('disabled');
        },
        onClick: function () {
            return this.get('onClick') || emptyFunction;
        },
        getDisplayText: function () {
            return this.get('displayText') || this.get('text') || this.get('name');
        },
        getExtraButtonText: function () {
            if (this.get('button')) {
                return this.get('button').text || "Click";
            } else {
                return null;
            }
        },
        getExtraButtonInfo: function () {
            var btnInfo = this.get('button');
            if (!btnInfo) {
                return btnInfo;
            }
            btnInfo = _.extend({
                click: emptyFunction,
                text: 'Click',
                extraClass: ''
            }, btnInfo);
            return btnInfo;
        }
    });
    var ListNodeView = BaseView.extend({
        tagName: 'li',
        className: 'bootstrap-pagination-list-node list-group-item',
        template: _.template(''),
        events: {
            'click a:first': 'onClick',
            'click .list-node-extra-btn:first': 'onClickExtraButton'
        },
        afterRender: function () {
            this.$el.html('');
            var $a = $("<a class='' href='javascript: void(0)'></a>");
            var $text = $("<span>" + this.model.getDisplayText() + "</span>");
            $a.append($("<span>&nbsp;</span>"));
            $a.append($text);
            this.$el.append($a);
            var buttonText = this.model.getExtraButtonText();
            if (buttonText) {
                var $btn = $("<button class='btn btn-xs btn-info list-node-extra-btn'></button>");
                $btn.css({
                    'position': 'absolute',
                    'right': 0,
                    'margin-top': '0',
                    'margin-right': '10px'
                });
                $btn.text(buttonText);
                this.$el.append($btn);
            }
        },
        onClick: function () {
            console.log('click');
            if (!this.model.isDisabled()) {
                this.model.onClick()(this, this.model, emptyFunction);
            }
        },
        onClickExtraButton: function () {
            var btnInfo = this.model.getExtraButtonInfo();
            if (!this.model.isDisabled()) {
                btnInfo.click(this, this.model, emptyFunction);
            }
        }
    });
    var PaginatorModel = Backbone.Model.extend({
        getPage: function () {
            return this.get('page') || 1;
        }
    });
    var PaginatorView = BaseView.extend({
        tagName: 'div',
        className: '',
        template: _.template(''),
        events: {
            'click .pagination-list-page-item': 'goToPage'
        },
        goToPage: function (e) {
            var $li = $(e.currentTarget);
            var page = parseInt($li.attr('data-page'));
            this.model.set('page', page);
            this.trigger('reloadPage', page);
        },
        afterRender: function () {
            this.$el.html('');
            var $ul = $("<ul class='pagination pagination-sm'></ul>");
            var pag = new Paginator(this.model.attributes);
            var $prev = $('<li class="pagination-list-prev-page pagination-list-page-item"><a href="#">&laquo;</a></li>');
            $prev.attr('data-page', '1');
            if (!pag.canPrev()) {
                $prev.addClass('disabled');
            }
            $ul.append($prev);
            for (var i = pag.getStartPage(); i <= pag.getEndPage(); ++i) {
                var $li = $('<li class="pagination-list-page-item" data-page="' + i + '"><a href="#">' + i + '</a></li>');
                if (i === this.model.getPage()) {
                    $li.addClass('active');
                }
                $ul.append($li);
            }
            var $next = $('<li class="pagination-list-next-page pagination-list-page-item"><a href="#">&raquo;</a></li>');
            $next.attr('data-page', '' + pag.getPageCount());
            if (!pag.canNext()) {
                $next.addClass('disabled');
            }
            $ul.append($next);
            this.$el.append($ul);
            var $totalEl = $("<span class='pagination-list-total-message'></span>");
            $totalEl.html(_.template(window.paginationListOptions.totalPagesDisplayFormat, {
                pageCount: pag.getPageCount(),
                total: pag.total
            }));
            $totalEl.css({
                margin: '20px 0',
                'padding-left': '17px',
                float: 'right'
            });
            this.$el.css({
                display: 'inline-block'
            });
            this.$el.append($totalEl);
        }
    });
    var PaginationListView = BaseView.extend({
        template: _.template('<ul class="list-group pagination-list-group"></ul><div class="pagination-list-paginator"></div>'),
        afterRender: function () {
            this.$(".pagination-list-group").html('');
            _.each(this.model.get('items'), function (item) {
                if (!(item instanceof Backbone.Model)) {
                    item = new ListNodeModel(item);
                }
                if (!item.get('onClick')) {
                    item.set('onClick', this.model.get('onClick'));
                }
                var view = new ListNodeView({model: item});
                this.$(".pagination-list-group").append(view.render().el);
            }, this);
            this.$(".pagination-list-paginator").html('');
            var paginatorModel = this.getPaginator();
            var paginatorView = new PaginatorView({
                model: paginatorModel
            });
            this.model.set('paginator', paginatorModel);
            this.listenTo(paginatorView, 'reloadPage', _.bind(function (page) {
                this.trigger('reloadPage', page);
            }, this));
            this.$(".pagination-list-paginator").html(paginatorView.render().el);
        },
        getPaginator: function () {
            var model = this.model.get('paginator');
            if (!(model instanceof Backbone.Model)) {
                model = new PaginatorModel(model);
            }
            return model;
        }
    });

    $.fn.extend({
        paginationList: function (options) {
            options.paginator = _.extend({

            }, options.paginator);
            options = _.extend({
                onLoadPage: function (paginator, callback) {
                    // 加载page的内容,返回列表数据和分页信息
                    // 格式为: { items: [ ... ], paginator: { ... } }
                },
                onLoadedPage: function (content, callback) {

                },
                onClick: function (view, model, callback) {

                },
                context: null
            }, options);
            var $container = $(this);
            $container.html('');
            var loadLocked = false;
            var paginatorListView = new PaginationListView({
                model: new Backbone.Model({
                    paginator: new PaginatorModel({
                        page: 1,
                        pageSize: 10,
                        total: 0,
                        paginationDisplayCount: 5
                    })
                })
            });
            paginatorListView.on('reloadPage', function () {
                requestToLoad(function () {
                    paginatorListView.render();
                });
            }, paginatorListView);
            var inited = false;

            function loadPageData(content, callback) {
                var model = new Backbone.Model(_.extend({onClick: _.bind(options.onClick, options.context)}, content));
                paginatorListView.model = model;
                if (!inited) {
                    inited = true;
                    $container.append(paginatorListView.render().el);
                }
                if (callback) {
                    callback(content);
                }
                options.onLoadedPage.call(options.context, model, callback);
            }

            function requestToLoad(callback) {
                if (loadLocked) {
                    return;
                }
                loadLocked = true;
                options.onLoadPage(paginatorListView.getPaginator(), function (data) {
                    loadPageData(data, callback);
                    loadLocked = false;
                });
            }

            requestToLoad(null);
        }
    })
})(jQuery);