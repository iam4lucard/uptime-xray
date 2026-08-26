exports.up = function (knex) {
    return knex.schema.alterTable("monitor", function (table) {
        table.text("xray_config");
        table.string("xray_protocol", 32);
        table.string("xray_test_url", 512);
        table.boolean("xray_check_exit_ip").defaultTo(false);
        table.string("xray_sub_url", 512);
        table.string("xray_sub_user_agent", 255);
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("monitor", function (table) {
        table.dropColumn("xray_config");
        table.dropColumn("xray_protocol");
        table.dropColumn("xray_test_url");
        table.dropColumn("xray_check_exit_ip");
        table.dropColumn("xray_sub_url");
        table.dropColumn("xray_sub_user_agent");
    });
};
