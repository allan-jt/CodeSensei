SRC = ./src
BIN = ${SRC}/bin
LIB = ${SRC}/lib
DYNAMO_DATA = ${LIB}/storage/dynamo-stack/scripts

CMD = cd ${SRC} && cdk

run_all:
	${CMD} deploy --all --require-approval never

run:
	${CMD} deploy $(filter-out $@,$(MAKECMDGOALS))

prune:
	docker system prune

destroy_all:
	${CMD} destroy --all

destroy_all_prune: destroy_all prune

destroy:
	${CMD} destroy $(filter-out $@,$(MAKECMDGOALS))

seed_dynamo:
	cd ${DYNAMO_DATA} && npx ts-node seed-dynamo.ts $(filter-out $@,$(MAKECMDGOALS))

%:
	@:

