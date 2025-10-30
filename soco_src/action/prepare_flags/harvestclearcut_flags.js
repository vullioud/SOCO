Action.prepare.clearcut = function(params, stand_data_obj) { // Add stand_data_obj as a parameter
    var rotation_age;

    // If the agent's plan provides a specific rotation age, use it.
    if (params && params.rotation_age) {
        rotation_age = params.rotation_age;
        console.log(`      -> Using planned rotation_age: ${rotation_age}`);
    } else {
     
        const current_age = stand_data_obj.iLand_stand_data.absolute_age;
        const random_offset = 1 + Math.floor(Math.random() * 5); // Random integer between 1 and 5
        rotation_age = current_age + random_offset;
        console.log(`      -> No rotation_age planned. Dynamically setting opt schedule to ${current_age} + ${random_offset} = ${rotation_age}`);
    }
    
    stand.setFlag('abe_param_rotation_age', rotation_age);
};