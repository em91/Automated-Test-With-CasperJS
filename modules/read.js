casper.test.begin("Test Read Module", {
	mails: [],

	/**
	 * 发送一些邮件测试用例
	 * @param  {Object} test 
	 * @return {void}      
	 */
	setUp: function( test ){
		$Login();

		//发信
		casper.then(function(){
			var subject = $Utils.send( $ComposeTestCase.read );
			$GLOBAL.mails = subject;
			this.test.info( "mails sent." );

			//发送完毕后点击收信
			casper.evaluate(function(){
				$( '.js-receive' ).click();
			})
		})
	},


	/**
	 * 测试完毕需要删除发送的邮件
	 * @param  {Object} test 
	 * @return {void}      
	 */
	tearDown: function( test ){
		$Utils.deleteMailBySubject( $GLOBAL.mails );
	},


	/**
	 * 功能测试逻辑
	 * @param  {Object} test 
	 * @return {void}      
	 */
	test: function( test ){
		var that = this;
		casper.wait( 2000, function(){
			that.goInbox();
			that.testNormal();
		});
		this.done();
	},

	/**
	 * 进入收件箱
	 * @return {void} 
	 */
	goInbox: function( ){
		//从列表进入读信
		casper.thenClick( x( $Utils.getMboxNavFolderXpath( $Folder.inbox.name ) ), function(){
			casper.test.comment( "go Inbox..." );
			casper.waitForSelector({
				type: "xpath",
				path: $XPATH.LIST_CONTAINER_EXIST
			}, function(){
				$Utils.capture( "normal_list.png" );
			})
		})
	},

	/**
	 * 测试基本的读信功能
	 * @return {void} 
	 */
	testNormal: function( ){
		var that = this;
		casper.thenClick( x ( $Utils.getXpathBySubject( $GLOBAL.mails.normal ) ), function(){
			casper.test.comment( "Test Normal Read..." );
			var readUrl = this.evaluate(function(){
				return location.protocol + "://" + location.host + "/jy5/xhr/msg/read.do?sid=" + $CONF.sid;
			})

			//等待读信请求返回后继续处理
			this.waitForResource( function( resource ){
				if( resource.url.indexOf( "xhr/msg/read.do" ) > -1 ){
					return true;
				}
				return false;
			}, function(){
				casper.test.assert( true, "read.do requested." )

				//查看工具栏是否正常
				var isToolbarOk = $Utils.checkXpathGroup([ $XPATH.TOOLBAR_BACK_BUTTON, $XPATH.TOOLBAR_DELETE_BUTTON,
					$XPATH.TOOLBAR_REPORT_BUTTON, $XPATH.TOOLBAR_FORWARD_BUTTON, $XPATH.TOOLBAR_REPLY_BUTTON, 
					$XPATH.TOOLBAR_MOVETO_BUTTON, $XPATH.TOOLBAR_MORE_BUTTON ])

				casper.test.assert( isToolbarOk, "Toolbar OK." );

				//快捷回复是否正常
				casper.test.assertExists( x( $XPATH.READ_QUICKREPLY ), "Quickreply OK." );

				that.testBackButton();
				that.testDeleteButton();
				that.testReportButton();
				that.testMoveTo();
			}, function(){
				casper.test.error( "no read.do request." );
			})
		});
	},

	/**
	 * 测试返回按钮，返回列表页面
	 * @return {void} 
	 */
	testBackButton: function(){
		casper.thenClick( x( $XPATH.TOOLBAR_BACK_BUTTON ), function(){
			casper.test.comment( "Test Back Button..." );
			this.waitForSelector({
				type: "xpath",
				path: $XPATH.LIST_CONTAINER_EXIST
			}, function(){
				$Utils.capture( "goback.png" );
				$MBOX.checkListUI();
				casper.click( x ( $Utils.getXpathBySubject( $GLOBAL.mails.normal ) ) );
			})
		})
	},

	/**
	 * 测试删除按钮，返回到列表
	 * @return {void} 
	 */
	testDeleteButton: function(){
		casper.wait( 200, function(){
			casper.test.comment( "Test Delete Button..." );
			casper.click( x( $XPATH.TOOLBAR_DELETE_BUTTON ) );
			$Utils.capture( "BeforeDelete.png" );
			casper.waitForSelector({
				type: "xpath",
				path: $XPATH.LIST_CONTAINER_EXIST
			}, function(){
				$Utils.capture( "AfterDelete.png" );
				$MBOX.withdrawTest(function(){
					$Utils.capture( "AfterWithDrawDelete.png" );
					casper.click( x ( $Utils.getXpathBySubject( $GLOBAL.mails.normal ) ) );
				});
			})
		})
	},

	/**
	 * 测试举报按钮，返回到列表
	 * @return {void}
	 */
	testReportButton: function(){
		casper.wait( 200, function(){
			$Utils.capture( "BeforeReport.png" );
			casper.test.comment( "Test Report Button..." );
			casper.click( x( $XPATH.TOOLBAR_REPORT_BUTTON ) );
			casper.waitForSelector({
				type: "xpath",
				path: $XPATH.LIST_CONTAINER_EXIST
			}, function(){
				var mids = $Utils.getMidBySubject( $GLOBAL.mails.normal );

				var inJunk = false;
				for( var i = 0, l = mids.length; i < l; i++ ){
					var msg = $READ.getMailContent( mids[i] );
					if( msg.data.curMsg.fid == 5 ){
						inJunk = true;
						break;
					}
				}
				this.test.assert( inJunk, "Report Success." );

				$Utils.capture( "AfterReport.png" );
				$MBOX.withdrawTest(function(){
					$Utils.capture( "AfterWithDrawReport.png" );
					casper.click( x ( $Utils.getXpathBySubject( $GLOBAL.mails.normal ) ) );
				});
			})
		})
	},

	/**
	 * 测试移动到功能，返回到列表
	 * @return {void} 
	 */
	testMoveTo: function(){
		casper.wait( 200, function(){
			$Utils.capture( "BeforeMoveTo.png" );
			casper.test.comment( "Test MoveTo..." );
			casper.click( x( $XPATH.TOOLBAR_MOVETO_BUTTON ) );
			this.wait( 200, function(){
				$Utils.assertDropMenu.apply( casper );

				var movemailXpath = $XPATH.TOOLBAR_MOVETO_FOLDER_2_MENU;
				this.click( x( movemailXpath ) );
				this.test.info( "Move clicked." );

				casper.waitForSelector({
					type: "xpath",
					path: $XPATH.LIST_CONTAINER_EXIST
				}, function(){
					$Utils.capture( "AfterMoveTo.png" );
					$MBOX.withdrawTest(function(){
						$Utils.capture( "AfterWithDrawReport.png" );
						casper.click( x ( $Utils.getXpathBySubject( $GLOBAL.mails.normal ) ) );
					});
				})

			})
		});
	},

	done: function(){
		casper.run(function(){
			this.test.done();
			this.test.renderResults( true, 0, this.cli.get( "o" ) || false );
		});
	}
});