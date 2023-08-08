const selectTarget_y = (fromElement, selector) => {
    if (!(fromElement instanceof HTMLElement)) {
      return null;
    }
  
    return fromElement.querySelector(selector);
  };
  
  const resizeData_height = {
    tracking: false,
    startHeight: null,
    startCursorScreenY: null,
    handleHeight: 10,
    resizeTarget: null,
    parentElement: null,
    maxHeight: null,
    minHeight: 200
  };
  
  $(document.body).on('mousedown', '.resize-handle--y', null, (event) => {
    if (event.button !== 0) {
      return;
    }

    console.log('Clicked!');
  
    event.preventDefault();
    event.stopPropagation();
  
    const handleElement = event.currentTarget;
    
    if (!handleElement.parentElement) {
      console.error(new Error("Parent element not found."));
      return;
    }
    
    // Use the target selector on the handle to get the resize target.
    const targetSelector = handleElement.getAttribute('data-target');
    const targetElement = selectTarget_y(handleElement.parentElement, targetSelector);
  
    if (!targetElement) {
      console.error(new Error("Resize target element not found."));
      return;
    }
    
    resizeData_height.startHeight = $(targetElement).outerHeight();
    resizeData_height.startCursorScreenY = event.screenY;
    resizeData_height.resizeTarget = targetElement;
    resizeData_height.parentElement = handleElement.parentElement;
    resizeData_height.maxHeight = $(handleElement.parentElement).innerHeight() - resizeData_height.handleHeight - resizeData_height.minHeight;
    resizeData_height.tracking = true;
  
    console.log('tracking started');
  });
  
  $(window).on('mousemove', null, null, _.debounce((event) => {
    if (resizeData_height.tracking) {
        //Calculate new top element height
        let cursorScreenYDelta = event.screenY - resizeData_height.startCursorScreenY;
        let newHeight = Math.min(resizeData_height.startHeight + cursorScreenYDelta, resizeData_height.maxHeight);
        newHeight = Math.max(resizeData_height.minHeight, newHeight);
        $(resizeData_height.resizeTarget).outerHeight(newHeight);
    
        //Calculate new bottom element height
        let right_panel_height = document.getElementById('right-panel').clientHeight;
        let textarea = document.getElementById('show-shard-container');
        let textarea_new_height = right_panel_height - newHeight - 17;
        textarea.style.height = textarea_new_height  +"px";
    }
  }, 1));
  
  $(window).on('mouseup', null, null, (event) => {
    if (resizeData_height.tracking) {
        resizeData_height.tracking = false;
  
      //console.log('tracking stopped');
    }
  });

  $(window).on('resize', null, null, (event) => {
    Update_Height_Right_Panel();
    Update_Width_Right_Panel();
  });

  // $(window).on('load', function() {
  //   resize();
  // });

  function Update_Height_Right_Panel(){
    document.getElementById('show-code-container').setAttribute("style","height:50%");

    shard_height = $("#show-code-container").height() - $("#resize-handle-y").height();

    document.getElementById('show-shard-container').setAttribute("style","height:"+shard_height+"px");
  }